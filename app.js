const API_URL = 'https://sheetdb.io/api/v1/k48i7ohykrblq';

let currentEditingGuest = null;

document.addEventListener('DOMContentLoaded', () => {
    loadGuests();
    setupEventListeners();
});

function setupEventListeners() {
    const form = document.getElementById('addGuestForm');
    form.addEventListener('submit', handleFormSubmit);

    const photoInput = document.getElementById('guestPhoto');
    photoInput.addEventListener('change', (e) => handlePhotoPreview(e, 'photoPreview'));

    const modalPhotoInput = document.getElementById('modalPhotoInput');
    modalPhotoInput.addEventListener('change', (e) => handlePhotoPreview(e, 'modalPhotoPreview'));

    const modalClose = document.querySelector('.modal-close');
    modalClose.addEventListener('click', closePhotoModal);

    const modalCancelBtn = document.getElementById('modalCancelBtn');
    modalCancelBtn.addEventListener('click', closePhotoModal);

    const modalSaveBtn = document.getElementById('modalSaveBtn');
    modalSaveBtn.addEventListener('click', handlePhotoUpdate);

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('photoModal');
        if (e.target === modal) {
            closePhotoModal();
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        const formData = new FormData(e.target);
        const photoInput = document.getElementById('guestPhoto');
        
        let photoBase64 = '';
        if (photoInput.files.length > 0) {
            photoBase64 = await resizeAndConvertImage(photoInput.files[0]);
        }

        const data = {
            "Convidado ": formData.get('Convidados'),
            Status: formData.get('Status'),
            Photo: photoBase64
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Erro ao adicionar convidado');
        }

        showToast('Convidado adicionado com sucesso!', 'success');
        e.target.reset();
        document.getElementById('photoPreview').innerHTML = '';
        loadGuests();

    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao adicionar convidado. Tente novamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

async function loadGuests() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const guestList = document.getElementById('guestList');

    loadingIndicator.style.display = 'block';
    errorMessage.style.display = 'none';
    guestList.innerHTML = '';

    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar convidados');
        }

        const guests = await response.json();
        
        loadingIndicator.style.display = 'none';

        if (guests.length === 0) {
            guestList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Nenhum convidado cadastrado ainda.</p>';
            return;
        }

        guests.forEach(guest => {
            const guestCard = createGuestCard(guest);
            if (guestCard) {
                guestList.appendChild(guestCard);
            }
        });

    } catch (error) {
        console.error('Erro ao carregar convidados:', error);
        loadingIndicator.style.display = 'none';
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Erro ao carregar a lista de convidados. Verifique sua conexão e tente novamente.';
    }
}

function createGuestCard(guest) {
    const card = document.createElement('div');
    card.className = 'guest-card';

    const guestName = guest["Convidado "] || guest.Convidados || 'Sem nome';
    
    if (!guestName || guestName.trim() === '' || guestName === 'Sem nome') {
        return null;
    }

    const photoDiv = document.createElement('div');
    if (guest.Photo && guest.Photo.trim() !== '') {
        const img = document.createElement('img');
        img.src = guest.Photo;
        img.alt = guestName;
        img.className = 'guest-photo';
        img.onerror = () => {
            img.style.display = 'none';
            const placeholder = createPhotoPlaceholder(guestName);
            photoDiv.appendChild(placeholder);
        };
        photoDiv.appendChild(img);
    } else {
        const placeholder = createPhotoPlaceholder(guestName);
        photoDiv.appendChild(placeholder);
    }

    const infoDiv = document.createElement('div');
    infoDiv.className = 'guest-info';
    
    const name = document.createElement('h3');
    name.textContent = guestName;
    
    const status = document.createElement('span');
    status.className = `guest-status status-${guest.Status.toLowerCase()}`;
    status.textContent = guest.Status;
    
    infoDiv.appendChild(name);
    infoDiv.appendChild(status);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'guest-actions';

    if (guest.Status !== 'Confirmado') {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-success';
        confirmBtn.textContent = 'Confirmar';
        confirmBtn.addEventListener('click', () => confirmGuest(guestName));
        actionsDiv.appendChild(confirmBtn);
    }


    card.appendChild(photoDiv);
    card.appendChild(infoDiv);
    card.appendChild(actionsDiv);

    return card;
}

function createPhotoPlaceholder(name) {
    const placeholder = document.createElement('div');
    placeholder.className = 'guest-photo-placeholder';
    placeholder.textContent = name.charAt(0).toUpperCase();
    return placeholder;
}

async function confirmGuest(guestName) {
    try {
        const response = await fetch(`${API_URL}/Convidado%20/${encodeURIComponent(guestName)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Status: 'Confirmado'
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao confirmar convidado');
        }

        showToast('Status atualizado para Confirmado!', 'success');
        loadGuests();

    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao confirmar convidado. Tente novamente.', 'error');
    }
}

function openPhotoModal(guestName) {
    currentEditingGuest = guestName;
    const modal = document.getElementById('photoModal');
    modal.style.display = 'flex';
    document.getElementById('modalPhotoInput').value = '';
    document.getElementById('modalPhotoPreview').innerHTML = '';
}

function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    modal.style.display = 'none';
    currentEditingGuest = null;
}

async function handlePhotoUpdate() {
    const photoInput = document.getElementById('modalPhotoInput');
    
    if (photoInput.files.length === 0) {
        showToast('Por favor, selecione uma foto primeiro.', 'error');
        return;
    }

    const saveBtn = document.getElementById('modalSaveBtn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoading = saveBtn.querySelector('.btn-loading');
    
    saveBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        const photoBase64 = await resizeAndConvertImage(photoInput.files[0]);

        const response = await fetch(`${API_URL}/Convidado%20/${encodeURIComponent(currentEditingGuest)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Photo: photoBase64
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar foto');
        }

        showToast('Foto atualizada com sucesso!', 'success');
        closePhotoModal();
        loadGuests();

    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao atualizar foto. Tente novamente.', 'error');
    } finally {
        saveBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

function handlePhotoPreview(e, previewElementId) {
    const file = e.target.files[0];
    const previewDiv = document.getElementById(previewElementId);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            previewDiv.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        previewDiv.innerHTML = '';
    }
}

function resizeAndConvertImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const maxWidth = 800;
                const maxHeight = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
