document.addEventListener('DOMContentLoaded', function() {
    const listingForm = document.getElementById('listingForm');
    const listingsContainer = document.getElementById('listingsContainer');
    const searchInput = document.getElementById('searchInput');
    const petTypeFilter = document.getElementById('petTypeFilter');

    // Get listings from localStorage
    function getStoredListings() {
        const listings = localStorage.getItem('petListings');
        return listings ? JSON.parse(listings) : [];
    }

    // Save listings to localStorage
    function saveListings(listings) {
        localStorage.setItem('petListings', JSON.stringify(listings));
    }

    // Load initial listings
    displayListings(getStoredListings());

    // Handle form submission
    listingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(listingForm);
        const listing = {
            pet_type: formData.get('pet_type'),
            breed: formData.get('breed'),
            location: {
                district: formData.get('district'),
                street: formData.get('street'),
                house: formData.get('house')
            },
            description: formData.get('description'),
            contact: formData.get('contact')
        };

        // Handle photo upload
        const photoFile = formData.get('photo');
        if (photoFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                listing.photo = e.target.result.split(',')[1]; // Get base64 part
                const listings = getStoredListings();
                listings.push(listing);
                saveListings(listings);
                listingForm.reset();
                displayListings(filterListings());
            };
            reader.readAsDataURL(photoFile);
        } else {
            const listings = getStoredListings();
            listings.push(listing);
            saveListings(listings);
            listingForm.reset();
            displayListings(filterListings());
        }
    });

    // Handle search and filter
    searchInput.addEventListener('input', () => displayListings(filterListings()));
    petTypeFilter.addEventListener('change', () => displayListings(filterListings()));

    function filterListings() {
        const searchText = searchInput.value.toLowerCase();
        const type = petTypeFilter.value;
        let listings = getStoredListings();

        if (type !== 'all') {
            listings = listings.filter(l => l.pet_type.toLowerCase() === type.toLowerCase());
        }
        if (searchText) {
            listings = listings.filter(l => 
                l.location.district.toLowerCase().includes(searchText) ||
                l.location.street.toLowerCase().includes(searchText) ||
                l.location.house.toLowerCase().includes(searchText)
            );
        }

        return listings;
    }

    async function deleteListing(listingId) {
        try {
            const response = await fetch(`/api/listings/${listingId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                const listings = getStoredListings();
                const updatedListings = listings.filter(l => l.id !== listingId);
                saveListings(updatedListings);
                displayListings(filterListings());
            }
        } catch (error) {
            console.error('Error deleting listing:', error);
        }
    }

    function displayListings(listings) {
        if (listings.length === 0) {
            listingsContainer.innerHTML = '<h2>Объявления не найдены</h2>';
            return;
        }

        listingsContainer.innerHTML = listings.map(listing => `
            <div class="listing-card">
                ${listing.photo ? `<img src="data:image/jpeg;base64,${listing.photo}" alt="Pet photo">` : ''}
                <h3>${listing.pet_type} - ${listing.breed}</h3>
                <p><strong>Местоположение:</strong> ${listing.location.district}, ${listing.location.street}, ${listing.location.house}</p>
                <p><strong>Описание:</strong> ${listing.description}</p>
                <p><strong>Контакты:</strong> ${listing.contact}</p>
                <button class="delete-button" onclick="deleteListing('${listing.id}')">Удалить объявление</button>
            </div>
        `).join('');

        // Add event listeners to delete buttons.  This is crucial to ensure that dynamically added buttons work.
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const listingId = button.getAttribute('data-listing-id'); //Use button instead of e.target
                deleteListing(listingId);
            });
        });

    }

    // Make deleteListing function available globally
    window.deleteListing = deleteListing;
});