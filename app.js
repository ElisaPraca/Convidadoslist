const API_URL = 'https://sheetdb.io/api/v1/k48i7ohykrblq';

const elements = {
    form: document.getElementById('guestForm'),
    guestName: document.getElementById('guestName'),
    guestStatus: document.getElementById('guestStatus'),
    messageBox: document.getElementById('messageBox'),
    loading: document.getElementById('loading'),
    tableContainer: document.querySelector('.table-container'),
    tableBody: document.getElementById('guestsTableBody'),
    emptyState: document.getElementById('emptyState')
};

function showMessage(message, type = 'info') {
    elements.messageBox.textContent = message;
    elements.messageBox.className = `message-box ${type}`;
    
    setTimeout(() => {
        elements.messageBox.className = 'message-box';
    }, 5000);
}

function showLoading(show = true) {
    if (show) {
        elements.loading.classList.add('active');
        elements.tableContainer.classList.remove('active');
        elements.emptyState.classList.remove('active');
    } else {
        elements.loading.classList.remove('active');
    }
}

async function fetchGuests() {
    showLoading(true);
    
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar convidados');
        }
        
        const data = await response.json();
        renderGuests(data);
        
    } catch (error) {
        console.error('Erro ao buscar convidados:', error);
        showMessage('Erro ao carregar a lista de convidados. Tente novamente.', 'error');
        showLoading(false);
        elements.emptyState.classList.add('active');
    }
}

function renderGuests(guests) {
    showLoading(false);
    
    if (!guests || guests.length === 0) {
        elements.emptyState.classList.add('active');
        elements.tableContainer.classList.remove('active');
        return;
    }
    
    elements.emptyState.classList.remove('active');
    elements.tableContainer.classList.add('active');
    
    elements.tableBody.innerHTML = '';
    
    guests.forEach((guest, index) => {
        const row = document.createElement('tr');
        
        const guestName = guest.Convidados || 'Sem nome';
        const guestStatus = guest.Status || 'Pendente';
        const statusClass = guestStatus.toLowerCase().replace(' ', '-');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = guestName;
        
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge status-${statusClass}`;
        statusBadge.textContent = guestStatus;
        statusCell.appendChild(statusBadge);
        
        const actionCell = document.createElement('td');
        const confirmButton = document.createElement('button');
        confirmButton.className = 'btn btn-confirm';
        confirmButton.textContent = guestStatus === 'Confirmado' ? 'Confirmado ✓' : 'Confirmar';
        confirmButton.disabled = guestStatus === 'Confirmado';
        confirmButton.addEventListener('click', () => confirmGuest(guestName));
        actionCell.appendChild(confirmButton);
        
        row.appendChild(nameCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);
        
        elements.tableBody.appendChild(row);
    });
}

async function addGuest(event) {
    event.preventDefault();
    
    const name = elements.guestName.value.trim();
    const status = elements.guestStatus.value;
    
    if (!name) {
        showMessage('Por favor, preencha o nome do convidado.', 'error');
        return;
    }
    
    showMessage('Salvando...', 'info');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    Convidados: name,
                    Status: status
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao adicionar convidado');
        }
        
        showMessage('Convidado adicionado com sucesso! ✓', 'success');
        
        elements.form.reset();
        
        setTimeout(() => {
            fetchGuests();
        }, 500);
        
    } catch (error) {
        console.error('Erro ao adicionar convidado:', error);
        showMessage('Erro ao adicionar convidado. Tente novamente.', 'error');
    }
}

async function confirmGuest(guestName) {
    if (!guestName) {
        showMessage('Nome do convidado não encontrado.', 'error');
        return;
    }
    
    showMessage('Atualizando status...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/Convidados/${encodeURIComponent(guestName)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    Status: 'Confirmado'
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao confirmar convidado');
        }
        
        showMessage('Status atualizado para Confirmado! ✓', 'success');
        
        setTimeout(() => {
            fetchGuests();
        }, 500);
        
    } catch (error) {
        console.error('Erro ao confirmar convidado:', error);
        showMessage('Erro ao atualizar status. Tente novamente.', 'error');
    }
}

elements.form.addEventListener('submit', addGuest);

fetchGuests();
