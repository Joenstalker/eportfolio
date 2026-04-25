const API_URL = 'http://localhost:5000/api/faculty-portfolio';

// Get portfolio by faculty ID
export const getPortfolio = async (facultyId, token) => {
    try {
        const response = await fetch(`${API_URL}/${facultyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return null; // Portfolio doesn't exist yet
            }
            throw new Error('Failed to fetch portfolio');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        throw error;
    }
};

// Save portfolio data
export const savePortfolio = async (facultyId, portfolioData, token) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ facultyId, portfolioData })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save portfolio');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving portfolio:', error);
        throw error;
    }
};

// Upload file for portfolio item
export const uploadPortfolioFile = async (facultyId, file, itemPath, token) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('itemPath', itemPath);
        
        const response = await fetch(`${API_URL}/upload/${facultyId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to upload file');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

// Remove file from portfolio item
export const removePortfolioFile = async (facultyId, itemPath, token) => {
    try {
        const response = await fetch(`${API_URL}/file/${facultyId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ itemPath })
        });
        
        if (!response.ok) {
            throw new Error('Failed to remove file');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error removing file:', error);
        throw error;
    }
};

// Delete portfolio
export const deletePortfolio = async (facultyId, token) => {
    try {
        const response = await fetch(`${API_URL}/${facultyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete portfolio');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting portfolio:', error);
        throw error;
    }
};
