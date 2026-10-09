// ======================================================
// APEX CLEAR - SAFE STORAGE & CORE ENGINE (PART 1)
// ======================================================

let cart = [];
let myOrders = getSafeStorage('apex_my_orders', []);

// SAFE STORAGE WRAPPERS
function getSafeStorage(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

function setSafeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn("LocalStorage save restricted.", e);
    }
}

function removeSafeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn("LocalStorage remove restricted.", e);
    }
}

// INITIALIZATION
document.addEventListener("DOMContentLoaded", function () {
    renderProductsGrid();
    updateCartCount();
    setupSupportForm();

    const savedTheme = getSafeStorage('apex_theme', 'dark');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
});

function getStoredProducts() {
    return getSafeStorage('apex_products', []);
}

// ADMIN PANEL SECURITY & LOGIC
function openAdminPanel() {
    const pwdModal = document.getElementById('passwordModal');
    const input = document.getElementById('adminPassInput');
    const errorMsg = document.getElementById('passErrorMsg');
    
    if (input) input.value = '';
    if (errorMsg) errorMsg.style.display = 'none';
    
    if (pwdModal) {
        pwdModal.classList.add('active-modal');
        pwdModal.style.setProperty('display', 'flex', 'important');
    }
}

function closePasswordModal() {
    const pwdModal = document.getElementById('passwordModal');
    const adminModal = document.getElementById('adminModal');
    
    if (pwdModal) {
        pwdModal.classList.remove('active-modal');
        pwdModal.style.setProperty('display', 'none', 'important');
    }
    
    if (adminModal) {
        adminModal.classList.remove('show-admin');
        adminModal.style.setProperty('display', 'none', 'important');
    }
}

function closeAdminPanel() {
    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
        adminModal.classList.remove('show-admin');
        adminModal.style.setProperty('display', 'none', 'important');
    }
}

function handleAdminAuth(event) {
    event.preventDefault();
    const passwordInput = document.getElementById('adminPasswordInput').value.trim();
    const savedPassword = getSafeStorage('apex_admin_password', null);

    if (!savedPassword) {
        if (passwordInput.length < 4) {
            alert("Password must be at least 4 characters long.");
            return;
        }
        setSafeStorage('apex_admin_password', passwordInput);
        alert("Admin password set successfully!");
        showAdminControlPanel();
    } else {
        if (passwordInput === savedPassword) {
            showAdminControlPanel();
        } else {
            alert("Access Denied: Incorrect Password!");
        }
    }
}

function showAdminControlPanel() {
    const authSec = document.getElementById('adminAuthSection');
    const ctrlPanel = document.getElementById('adminControlPanel');
    if (authSec) authSec.style.display = "none";
    if (ctrlPanel) ctrlPanel.style.display = "block";
    renderAdminInventoryList();
    renderAdminOrdersList();
}

function resetAdminPassword() {
    const savedPassword = getSafeStorage('apex_admin_password', null);
    const currentPass = prompt("Enter current admin password to reset:");
    
    if (currentPass === savedPassword) {
        removeSafeStorage('apex_admin_password');
        alert("Admin password reset successfully. Please set a new password.");
        closeAdminPanel();
    } else if (currentPass !== null) {
        alert("Incorrect password!");
    }
}

// RENDER STORE PRODUCTS
function renderProductsGrid() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const products = getStoredProducts();
    grid.innerHTML = "";

    const noResults = document.getElementById('noResults');

    if (products.length === 0) {
        if (noResults) {
            noResults.style.display = "block";
            noResults.innerText = "No products available in store.";
        }
        return;
    }

    if (noResults) noResults.style.display = "none";

    products.forEach(product => {
        const isOutOfStock = parseInt(product.stock) <= 0;
        const card = document.createElement('div');
        card.className = "product-card";

        card.innerHTML = `
            <span class="badge-tag" style="background-color: ${isOutOfStock ? '#da3633' : '#1f6beb'};">
                ${isOutOfStock ? 'Out of Stock' : 'Stock: ' + product.stock}
            </span>
            <div class="product-img">
                <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150';" style="max-width: 100%; max-height: 100px; object-fit: contain;">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="desc">${product.desc}</p>
                <div class="curr-price">${product.price}</div>
                ${isOutOfStock ? 
                    `<button class="btn-buy" disabled style="background-color: #30363d; color: #8b949e; cursor: not-allowed;">Unavailable</button>` : 
                    `<button class="btn-buy" onclick="triggerCheckoutModal('${product.name}', '${product.price}')">Buy via COD</button>
                     <button class="btn-add-cart" onclick="addToCart('${product.name}', '${product.price}')">+ Add to Cart</button>`
                }
            </div>
        `;
        grid.appendChild(card);
    });
}

// ======================================================
// APEX CLEAR - ADMIN INVENTORY, UI & CHECKOUT (PART 2)
// ======================================================

function saveProductByAdmin(event) {
    event.preventDefault();

    const name = document.getElementById('adminPName').value.trim();
    const desc = document.getElementById('adminPDesc').value.trim();
    const price = document.getElementById('adminPrice').value.trim();
    const stock = parseInt(document.getElementById('adminStock').value);
    const img = document.getElementById('adminPImage').value.trim();

    let products = getStoredProducts();
    products.push({ id: Date.now(), name, desc, price, stock, image: img });

    setSafeStorage('apex_products', products);

    alert(`Product "${name}" successfully added!`);
    document.getElementById('addProductForm').reset();
    closeAdminPanel();
    renderProductsGrid();
}

function updateCartCount() {
    const countSpan = document.getElementById('cartCount');
    if (countSpan) countSpan.innerText = cart.length;
}

function setupSupportForm() {
    const supportForm = document.getElementById('supportForm');
    if (supportForm) {
        supportForm.onsubmit = function (e) {
            e.preventDefault();
            const name = document.getElementById('custName').value;
            alert(`Thank you, ${name}! Your support ticket has been submitted.`);
            supportForm.reset();
        };
    }
}

function clearAllProducts() {
    if (confirm("Are you sure you want to remove all existing product data?")) {
        removeSafeStorage('apex_products');
        renderProductsGrid();
        alert("All product data cleared successfully!");
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    
    // Save theme preference
    localStorage.setItem('apex_theme', isLight ? 'light' : 'dark');

    // Force style changes on body & all main containers
    if (isLight) {
        document.body.style.setProperty('background-color', '#ffffff', 'important');
        document.body.style.setProperty('color', '#1f2328', 'important');
    } else {
        document.body.style.setProperty('background-color', '#0b0f19', 'important');
        document.body.style.setProperty('color', '#e6edf3', 'important');
    }

    // Force update all cards and sections
    const elementsToToggle = document.querySelectorAll('.hero, .cat-card, .product-card, header, .modal-content, .cart-drawer, .admin-section');
    elementsToToggle.forEach(el => {
        if (isLight) {
            el.style.setProperty('background-color', '#f6f8fa', 'important');
            el.style.setProperty('color', '#1f2328', 'important');
            el.style.setProperty('border-color', '#d0d7de', 'important');
        } else {
            el.style.setProperty('background-color', 'rgba(22, 27, 34, 0.75)', 'important');
            el.style.setProperty('color', '#e6edf3', 'important');
            el.style.setProperty('border-color', 'rgba(255, 255, 255, 0.08)', 'important');
        }
    });
}

// CART & ORDERS SUMMARY
function openCartSummary() {
    if (cart.length === 0) {
        showCustomModal("Cart", "Your cart is currently empty.");
        return;
    }
    let htmlContent = "<ul style='list-style: none; padding: 0;'>";
    cart.forEach((item) => {
        htmlContent += `<li style='padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;'>
            <span>${item.name}</span>
            <strong style='color: var(--accent-hover);'>${item.price}</strong>
        </li>`;
    });
    htmlContent += "</ul>";
    showCustomModal("Your Shopping Cart", htmlContent);
}

function showMyOrders() {
    const orders = getSafeStorage('apex_my_orders', []);
    if (orders.length === 0) {
        showCustomModal("My Orders", "You have not placed any orders yet.");
        return;
    }
    let htmlContent = "<div style='max-height: 250px; overflow-y: auto;'>";
    orders.forEach((ord) => {
        htmlContent += `<div style='padding: 10px; margin-bottom: 8px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 6px;'>
            <div style='font-weight: bold; color: var(--heading-color);'>${ord.name}</div>
            <div style='font-size: 12px; color: #8b949e;'>Price: ${ord.price} | Date: ${ord.date}</div>
        </div>`;
    });
    htmlContent += "</div>";
    showCustomModal("Order History", htmlContent);
}

function addToCart(name, price) {
    cart.push({ name, price });
    updateCartCount();
    showToast(`"${name}" added to cart!`);
}

// CUSTOM POPUP MODAL
function showCustomModal(title, bodyHtml) {
    let modal = document.getElementById('customNotificationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'customNotificationModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn" onclick="document.getElementById('customNotificationModal').style.display='none'">&times;</span>
            <h3 style="margin-bottom: 15px; color: var(--heading-color);">${title}</h3>
            <div>${bodyHtml}</div>
            <button class="btn-primary" onclick="document.getElementById('customNotificationModal').style.display='none'" style="margin-top: 15px;">Close</button>
        </div>
    `;
    modal.style.display = "block";
}

// ADMIN INVENTORY & ORDERS MANAGERS
function renderAdminInventoryList() {
    const listContainer = document.getElementById('adminProductList');
    if (!listContainer) return;

    const products = getStoredProducts();
    if (products.length === 0) {
        listContainer.innerHTML = "<p style='font-size: 12px; color: #8b949e;'>No products currently in store.</p>";
        return;
    }

    let html = "";
    products.forEach(p => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin-bottom: 6px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 6px;">
                <div>
                    <strong style="font-size: 13px; color: var(--heading-color);">${p.name}</strong>
                    <div style="font-size: 11px; color: #8b949e;">${p.price} | Stock: ${p.stock}</div>
                </div>
                <button onclick="deleteProductByAdmin(${p.id})" style="background: #da3633; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Delete</button>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}

function deleteProductByAdmin(productId) {
    if (confirm("Are you sure you want to delete this product?")) {
        let products = getStoredProducts();
        products = products.filter(p => p.id !== productId);
        setSafeStorage('apex_products', products);
        renderAdminInventoryList();
        renderProductsGrid();
    }
}

function renderAdminOrdersList() {
    const ordersContainer = document.getElementById('adminOrdersList');
    if (!ordersContainer) return;

    const orders = getSafeStorage('apex_my_orders', []);
    if (orders.length === 0) {
        ordersContainer.innerHTML = "<p style='font-size: 12px; color: #8b949e;'>No orders received yet.</p>";
        return;
    }

    let html = "";
    orders.forEach((ord, index) => {
        html += `
            <div style="padding: 10px; margin-bottom: 8px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px;">
                <div style="font-weight: bold; color: var(--accent-hover);">Order #${index + 1} - ${ord.name}</div>
                <div>Price: <strong>${ord.price}</strong></div>
                <div>Customer: ${ord.customerName || 'N/A'} (${ord.customerPhone || 'N/A'})</div>
                <div>Address: ${ord.customerAddress || 'N/A'}</div>
                <div style="color: #8b949e; font-size: 10px; margin-top: 4px;">Date: ${ord.date}</div>
            </div>
        `;
    });
    ordersContainer.innerHTML = html;
}

// CHECKOUT FORM WITH PROMO CODE LOGIC
function triggerCheckoutModal(pName, pPrice) {
    appliedDiscount = 0;
    let modal = document.getElementById('checkoutModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'checkoutModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn" onclick="document.getElementById('checkoutModal').style.display='none'">&times;</span>
            <h3 style="margin-bottom: 10px; color: var(--heading-color);">Checkout (COD)</h3>
            <p style="font-size: 13px; color: #8b949e; margin-bottom: 10px;">Item: <strong>${pName}</strong> (${pPrice})</p>
            
            <!-- COUPON CODE SECTION -->
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <input type="text" id="couponCodeInput" placeholder="Promo Code (e.g. APEX10)" style="flex:1; padding: 6px; font-size: 12px; margin: 0;">
                <button type="button" onclick="applyPromoCode()" style="padding: 6px 10px; font-size: 12px; background: var(--accent-color); color: white; border: none; border-radius: 4px; cursor: pointer;">Apply</button>
            </div>
            <div id="couponMsg" style="font-size: 11px; margin-bottom: 10px;"></div>

            <!-- CUSTOMER DETAILS FORM -->
            <form onsubmit="confirmOrderPlacement(event, '${pName}', '${pPrice}')">
                <input type="text" id="orderCustName" placeholder="Full Name" required style="width: 100%; margin-bottom: 10px;">
                <input type="tel" id="orderCustPhone" placeholder="Mobile Number" required style="width: 100%; margin-bottom: 10px;">
                <textarea id="orderCustAddress" rows="3" placeholder="Full Delivery Address" required style="width:100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); margin-bottom: 10px;"></textarea>
                <button type="submit" class="btn-primary" style="width: 100%;">Confirm Cash on Delivery Order</button>
            </form>
        </div>
    `;
    modal.style.display = "block";
}

// ======================================================
// ADMIN ANALYTICS & EXTRA UTILITIES
// ======================================================

function renderAdminAnalytics() {
    const products = getStoredProducts();
    const orders = getSafeStorage('apex_my_orders', []);

    const totalProducts = products.length;
    const outOfStock = products.filter(p => parseInt(p.stock) <= 0).length;
    const totalOrders = orders.length;

    let analyticsDiv = document.getElementById('adminAnalytics');
    if (!analyticsDiv) {
        analyticsDiv = document.createElement('div');
        analyticsDiv.id = 'adminAnalytics';
        analyticsDiv.style.cssText = "display: flex; gap: 10px; margin-bottom: 15px;";
        const controlPanel = document.getElementById('adminControlPanel');
        if (controlPanel) controlPanel.prepend(analyticsDiv);
    }

    analyticsDiv.innerHTML = `
        <div style="flex:1; background: var(--bg-color); border:1px solid var(--border-color); padding:10px; border-radius:6px; text-align:center;">
            <div style="font-size:11px; color:#8b949e;">Products</div>
            <strong style="font-size:16px; color:var(--heading-color);">${totalProducts}</strong>
        </div>
        <div style="flex:1; background: var(--bg-color); border:1px solid var(--border-color); padding:10px; border-radius:6px; text-align:center;">
            <div style="font-size:11px; color:#da3633;">Out of Stock</div>
            <strong style="font-size:16px; color:#da3633;">${outOfStock}</strong>
        </div>
        <div style="flex:1; background: var(--bg-color); border:1px solid var(--border-color); padding:10px; border-radius:6px; text-align:center;">
            <div style="font-size:11px; color:var(--accent-hover);">Orders</div>
            <strong style="font-size:16px; color:var(--accent-hover);">${totalOrders}</strong>
        </div>
    `;
}

// PROMO CODE LOGIC
let appliedDiscount = 0;

function applyPromoCode() {
    const input = document.getElementById('couponCodeInput');
    const msg = document.getElementById('couponMsg');
    if (!input || !msg) return;

    const code = input.value.trim().toUpperCase();

    if (code === "APEX10") {
        appliedDiscount = 10;
        msg.style.color = "#2ea043";
        msg.innerText = "Success! 10% Discount Applied.";
    } else if (code === "APEX20") {
        appliedDiscount = 20;
        msg.style.color = "#2ea043";
        msg.innerText = "Success! 20% Special Discount Applied.";
    } else {
        appliedDiscount = 0;
        msg.style.color = "#da3633";
        msg.innerText = "Invalid Promo Code!";
    }
}

// EXPORT STORE DATA
function exportStoreData() {
    const data = {
        products: getStoredProducts(),
        orders: getSafeStorage('apex_my_orders', [])
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `apex_store_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}
// ORDER CONFIRMATION LOGIC
function confirmOrderPlacement(event, pName, pPrice) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('orderCustName');
    const phoneInput = document.getElementById('orderCustPhone');
    const addressInput = document.getElementById('orderCustAddress');

    const name = nameInput ? nameInput.value : '';
    const phone = phoneInput ? phoneInput.value : '';
    const address = addressInput ? addressInput.value : '';

    let orders = getSafeStorage('apex_my_orders', []);
    orders.push({
        name: pName || 'Product',
        price: pPrice || '',
        discount: appliedDiscount > 0 ? `${appliedDiscount}% OFF` : null,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        date: new Date().toLocaleDateString()
    });

    setSafeStorage('apex_my_orders', orders);

    const modal = document.getElementById('checkoutModal');
    if (modal) modal.style.display = 'none';

    showCustomModal(
        "Order Placed Successfully!",
        `Thank you <strong>${name}</strong>! Your Cash on Delivery order for <strong>${pName || 'item'}</strong> ${appliedDiscount > 0 ? '(with ' + appliedDiscount + '% OFF)' : ''} has been received.`
    );
}

// SUPPORT MODAL CONTROLS
function openSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.style.display = 'block';
}

function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.style.setProperty('display', 'none', 'important');
}

function handleSupportSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('custName').value;
    const orderID = document.getElementById('custOrderID').value || 'N/A';
    const issue = document.getElementById('queryType').value;

    closeSupportModal();
    showCustomModal(
        "Ticket Submitted!",
        `Thank you <strong>${name}</strong>. Your ticket regarding <strong>"${issue}"</strong> (Order ID: ${orderID}) has been logged. Our support team will contact you shortly.`
    );
    document.getElementById('supportForm').reset();
}

// HORIZONTAL & SEE MORE PRODUCT RENDERER
function renderProducts() {
    const products = getStoredProducts();
    const trendingGrid = document.getElementById('trendingProductsGrid');
    const featuredGrid = document.getElementById('featuredProductsGrid');
    const fullGrid = document.getElementById('productGrid');
    const noResults = document.getElementById('noResults');

    if (!trendingGrid || !featuredGrid) return;

    if (products.length === 0) {
        if (noResults) noResults.style.display = 'block';
        trendingGrid.innerHTML = '';
        featuredGrid.innerHTML = '';
        return;
    }

    if (noResults) noResults.style.display = 'none';

    const row1Products = products.slice(0, 10);
    const row2Products = products.slice(10, 20);

    const createCardHTML = (p) => `
        <div class="product-card" style="flex: 0 0 140px !important; width: 140px !important; min-width: 140px !important; box-sizing: border-box !important;">
            
            <span class="stock-badge">Stock: ${p.stock}</span>
            <img src="${p.image}" alt="${p.title || p.name}" class="product-img" onerror="this.src='https://via.placeholder.com/150'">
            <div class="product-info">
                <h4 class="product-title">${p.title || p.name}</h4>
                <p class="product-desc">${p.description || p.desc || ''}</p>
                <div class="product-price">${p.price}</div>
                <button class="btn-primary buy-btn" onclick="triggerCheckoutModal('${p.title || p.name}', '${p.price}')">Buy via COD</button>
                <button class="btn-primary cart-btn" style="background:#30363d; margin-top:5px;" onclick="addToCart('${p.title || p.name}', '${p.price}')">+ Add to Cart</button>
            </div>
        </div>
    `;

    trendingGrid.innerHTML = row1Products.map(createCardHTML).join('');
    featuredGrid.innerHTML = row2Products.map(createCardHTML).join('');

    if (fullGrid) {
        fullGrid.innerHTML = products.map(createCardHTML).join('');
    }
}

function seeMoreProducts() {
    const container = document.getElementById('allProductsContainer');
    if (container) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

document.addEventListener('DOMContentLoaded', renderProducts);

// ======================================================
// SEARCH, WISHLIST & CATEGORY FILTERING
// ======================================================

function searchProducts() {
    const inputEl = document.getElementById('searchInput');
    if (!inputEl) return;
    const query = inputEl.value.toLowerCase().trim();
    const products = getStoredProducts();
    const filtered = products.filter(p => {
        const title = (p.title || p.name || '').toLowerCase();
        const desc = (p.description || p.desc || '').toLowerCase();
        return title.includes(query) || desc.includes(query);
    });

    renderFilteredProducts(filtered);
}

function filterByCategory(categoryName, btnElement) {
    if (btnElement) {
        document.querySelectorAll('.cat-chip').forEach(chip => chip.classList.remove('active'));
        btnElement.classList.add('active');
    }

    if (!categoryName) return;
    const products = getStoredProducts();
    
    const filtered = products.filter(p => 
        p && p.category && String(p.category).toLowerCase() === String(categoryName).toLowerCase()
    );

    const fallbackFiltered = filtered.length > 0 ? filtered : products.filter(p => {
        const title = (p.title || p.name || '').toLowerCase();
        return title.includes(String(categoryName).toLowerCase());
    });

    renderFilteredProducts(fallbackFiltered.length > 0 ? fallbackFiltered : products);
    showToast(`Showing products for: ${categoryName}`);
}

function renderFilteredProducts(productsList) {
    const fullGrid = document.getElementById('productGrid');
    const container = document.getElementById('allProductsContainer');

    if (container) container.style.display = 'block';

    if (fullGrid) {
        if (productsList.length === 0) {
            fullGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px; color:#8b949e;">No matching products found.</div>';
        } else {
            fullGrid.innerHTML = productsList.map(p => `
                <div class="product-card" style="position:relative;">
                    <button class="wishlist-btn" onclick="toggleWishlist('${p.title || p.name}')">&#9829;</button>
                    <span class="stock-badge">Stock: ${p.stock}</span>
                    <img src="${p.image}" alt="${p.title || p.name}" class="product-img" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="product-info">
                        <h4 class="product-title">${p.title || p.name}</h4>
                        <div class="product-rating">&#9733; 4.5 <span>(24 reviews)</span></div>
                        <p class="product-desc">${p.description || p.desc || ''}</p>
                        <div class="product-price">${p.price}</div>
                        <button class="btn-primary buy-btn" onclick="triggerCheckoutModal('${p.title || p.name}', '${p.price}')">Buy via COD</button>
                        <button class="btn-primary cart-btn" style="background:#30363d; margin-top:5px;" onclick="addToCart('${p.title || p.name}', '${p.price}')">+ Add to Cart</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// WISHLIST SYSTEM
function toggleWishlist(productTitle) {
    let wishlist = getSafeStorage('apex_wishlist', []);
    const index = wishlist.indexOf(productTitle);

    if (index > -1) {
        wishlist.splice(index, 1);
        showToast(`Removed "${productTitle}" from Wishlist`);
    } else {
        wishlist.push(productTitle);
        showToast(`Added "${productTitle}" to Wishlist!`);
    }

    setSafeStorage('apex_wishlist', wishlist);
}

// NAVIGATION MENU TOGGLE
function toggleMenu() {
    const nav = document.getElementById('navMenu');
    const btn = document.querySelector('.hamburger-btn');
    
    if (nav && btn) {
        nav.classList.toggle('open');
        btn.classList.toggle('active');
    }
}

document.addEventListener('click', (e) => {
    const header = document.querySelector('header');
    const nav = document.getElementById('navMenu');
    if (header && nav && !header.contains(e.target) && nav.classList.contains('open')) {
        toggleMenu();
    }
});

// CHECKOUT & PAYMENTS
function togglePaymentUI() {
    const method = document.getElementById('paymentMethod').value;
    const upiBox = document.getElementById('upiPaymentBox');
    if (upiBox) {
        upiBox.style.display = (method === 'UPI') ? 'block' : 'none';
    }
}

function closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.style.setProperty('display', 'none', 'important');
    }
}

function openCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function processRealOrder(event) {
    event.preventDefault();

    const nameEl = document.getElementById('shipName');
    const phoneEl = document.getElementById('shipPhone');
    const paymentEl = document.getElementById('paymentMethod');

    const name = nameEl ? nameEl.value : '';
    const phone = phoneEl ? phoneEl.value : '';
    const paymentMethod = paymentEl ? paymentEl.value : 'COD';
    const amount = 499;

    if (paymentMethod === 'COD') {
        alert(' Cash on Delivery Order Successful!');
        closeCheckoutModal();
        return;
    }

    const myUpiId = "YOURNAME@upi"; 
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${myUpiId}&pn=APEX%20CLEAR&am=${amount}&cu=INR`;

    const upiBox = document.getElementById('upiPaymentBox');
    if (upiBox) {
        upiBox.style.display = 'block';
        upiBox.innerHTML = `
            <h4>Scan to Pay ₹${amount}</h4>
            <img src="${qrUrl}" alt="UPI QR Code" style="width: 200px; margin: 10px 0;">
            <p><strong>UPI ID:</strong> ${myUpiId}</p>
            <p style="font-size: 12px; color: #8b949e;">पेमेंट करने के बाद नीचे UTR / Ref Number डालें</p>
        `;
    }
}

// CLOSE MODALS ON OUTSIDE CLICK
window.onclick = function(event) {
    const adminModal = document.getElementById('adminModal');
    const supportModal = document.getElementById('supportModal');
    const checkoutModal = document.getElementById('checkoutModal');
    const pwdModal = document.getElementById('passwordModal');

    if (event.target === adminModal) closeAdminPanel();
    if (event.target === supportModal) closeSupportModal();
    if (event.target === checkoutModal) closeCheckoutModal();
    if (event.target === pwdModal) closePasswordModal();
};

// SEARCH BAR THEME SYNC
function fixSearchBarTheme() {
    const wrapper = document.querySelector('.search-wrapper');
    const input = document.querySelector('.search-wrapper input');
    if (!wrapper) return;

    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const isLight = bodyBg === 'rgb(255, 255, 255)' || 
                    bodyBg === 'rgb(248, 249, 250)' || 
                    bodyBg === 'rgb(240, 242, 245)' ||
                    !document.body.classList.contains('dark-mode') && !document.body.classList.contains('dark');

    if (isLight) {
        wrapper.style.setProperty('background-color', '#ffffff', 'important');
        wrapper.style.setProperty('border-color', '#e2e8f0', 'important');
        if (input) input.style.setProperty('color', '#1a1d20', 'important');
    } else {
        wrapper.style.setProperty('background-color', '#161b22', 'important');
        wrapper.style.setProperty('border-color', '#30363d', 'important');
        if (input) input.style.setProperty('color', '#ffffff', 'important');
    }
}

setInterval(fixSearchBarTheme, 1000);

// ADMIN TAB SWITCHING
function switchAdminTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.classList.add('active');
    if (btnElement) btnElement.classList.add('active');
}

function togglePasswordVisibility() {
    const input = document.getElementById('adminPassInput');
    const eyeIcon = document.getElementById('eyeIcon');             
    const eyeSlashIcon = document.getElementById('eyeSlashIcon');   

    if (!input) return;

    if (input.type === 'password') {
        // पासवर्ड दिखाएँ -> स्लैश वाला आइकॉन दिखाएँ ताकि क्लिक करने पर वापस छुप सके
        input.type = 'text';
        if (eyeIcon) eyeIcon.style.display = 'none';
        if (eyeSlashIcon) eyeSlashIcon.style.display = 'inline-block';
    } else {
        // पासवर्ड छुपाएँ -> बिना स्लैश वाला सामान्य आँख का आइकॉन दिखाएँ
        input.type = 'password';
        if (eyeIcon) eyeIcon.style.display = 'inline-block';
        if (eyeSlashIcon) eyeSlashIcon.style.display = 'none';
    }
}

// TOAST NOTIFICATION FUNCTION
function showToast(message, icon = "") {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (toast && toastMsg) {
        toastMsg.innerText = message;
        if (toastIcon) toastIcon.innerText = icon;
        
        toast.style.setProperty('display', 'flex', 'important');

        setTimeout(() => {
            toast.style.setProperty('display', 'none', 'important');
        }, 2500);
    }
}

// SUBMIT ADMIN PASSWORD LOGIC
function submitAdminPassword() {
    const pwdModal = document.getElementById('passwordModal');
    
    // modal check
    if (!pwdModal || pwdModal.style.display === 'none' || getComputedStyle(pwdModal).display === 'none') {
        return;
    }

    const input = document.getElementById('adminPassInput');
    const errorMsg = document.getElementById('passErrorMsg');
    const password = input ? input.value.trim() : '';

    if (password === "") {
        showToast("Please enter a password!", "");
        return;
    }

    if (password === "Atharv Ui") {
        closePasswordModal();
        showToast("Login Successful!", "");
        
        const adminModal = document.getElementById('adminModal');
        if (adminModal) {
            adminModal.classList.add('show-admin');
            adminModal.style.setProperty('display', 'flex', 'important');
        }
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
        showToast("Incorrect password! Access denied.", "");
    }
}
// ==========================================
// MISSING ADMIN AUTHENTICATION & INITIALIZATION
// ==========================================

// SUBMIT ADMIN PASSWORD LOGIC
function submitAdminPassword() {
    const pwdModal = document.getElementById('passwordModal');
    
    if (!pwdModal || pwdModal.style.display === 'none' || getComputedStyle(pwdModal).display === 'none') {
        return;
    }

    const input = document.getElementById('adminPassInput');
    const errorMsg = document.getElementById('passErrorMsg');
    const password = input ? input.value.trim() : '';

    if (password === "") {
        showToast("Please enter a password!", "");
        return;
    }

    if (password === "Atharv Ui") {
        closePasswordModal();
        showToast("Login Successful!", "");
        
        const adminModal = document.getElementById('adminModal');
        if (adminModal) {
            adminModal.classList.add('show-admin');
            adminModal.style.setProperty('display', 'flex', 'important');
            showAdminControlPanel();
        }
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
        showToast("Incorrect password! Access denied.", "");
    }
}

// ATTACH ENTER KEY EVENT TO PASSWORD INPUT
document.addEventListener("DOMContentLoaded", function () {
    const adminPassInput = document.getElementById('adminPassInput');
    if (adminPassInput) {
        adminPassInput.addEventListener("keyup", function (event) {
            if (event.key === "Enter") {
                submitAdminPassword();
            }
        });
    }
});
function addNewProduct(event) {
    if (event) event.preventDefault();

    // Screen par jitne bhi visible text/number inputs hain unko get kar rahe hain
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])'))
                         .filter(input => input.offsetParent !== null || input.offsetWidth > 0 || input.offsetHeight > 0);

    let name = '', description = '', originalPrice = '', price = '', image = '';

    // Pehle IDs se try kar rahe hain
    const nameEl = document.getElementById('productName') || document.getElementById('newProductName');
    const descEl = document.getElementById('productDesc') || document.getElementById('productDescription');
    const origPriceEl = document.getElementById('productOriginalPrice') || document.getElementById('originalPrice');
    const priceEl = document.getElementById('productPrice') || document.getElementById('newProductPrice');
    const imageEl = document.getElementById('productImage') || document.getElementById('productImageUrl');

    if (nameEl && nameEl.value.trim()) name = nameEl.value.trim();
    if (descEl && descEl.value.trim()) description = descEl.value.trim();
    if (origPriceEl && origPriceEl.value.trim()) originalPrice = origPriceEl.value.trim();
    if (priceEl && priceEl.value.trim()) price = priceEl.value.trim();
    if (imageEl && imageEl.value.trim()) image = imageEl.value.trim();

    // Agar IDs se nahi mila, toh screen par dikhne waale sequence se padhenge
    if (!name || !price) {
        const allInputs = document.querySelectorAll('input');
        const filledInputs = Array.from(allInputs).filter(i => i.value && i.value.trim() !== '');
        
        if (filledInputs.length >= 2) {
            name = filledInputs[0].value.trim();
            if (filledInputs.length >= 5) {
                description = filledInputs[1].value.trim();
                originalPrice = filledInputs[2].value.trim();
                price = filledInputs[3].value.trim();
                image = filledInputs[4].value.trim();
            } else {
                price = filledInputs[filledInputs.length - 1].value.trim();
            }
        }
    }

    // Validation Check
    if (!name || !price) {
        if (typeof showToast === 'function') {
            showToast("Please enter product name and price!", "error");
        } else {
            alert("Please enter product name and price!");
        }
        return;
    }

    // New Product Object
    const newProduct = {
        id: Date.now(),
        name: name,
        description: description,
        originalPrice: originalPrice,
        price: parseFloat(price),
        image: image || "https://via.placeholder.com/150"
    };

    // Save
    let currentProducts = typeof getSafeStorage === 'function' ? getSafeStorage('apex_products', []) : [];
    currentProducts.push(newProduct);
    if (typeof setSafeStorage === 'function') setSafeStorage('apex_products', currentProducts);

    // Reset inputs
    document.querySelectorAll('input').forEach(input => {
        if (input.type !== 'submit' && input.type !== 'button') input.value = '';
    });

    // Refresh UI
    if (typeof renderProductsGrid === 'function') renderProductsGrid();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderAdminInventoryList === 'function') renderAdminInventoryList();

    if (typeof showToast === 'function') {
        showToast("Product added successfully!", "success");
    } else {
        alert("Product added successfully!");
    }
}

window.addNewProduct = addNewProduct;
window.handleAddProduct = addNewProduct;

// 2. EXPORT DATA FUNCTION
function exportData() {
    if (typeof exportStoreData === 'function') {
        exportStoreData();
    } else {
        const data = {
            products: getStoredProducts(),
            orders: getSafeStorage('apex_my_orders', [])
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `apex_store_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("Data exported successfully!", "");
    }
}

// 3. CLEAR ALL DATA FUNCTION
function clearAllData() {
    if (confirm("Are you sure you want to clear all product and order data? This cannot be undone.")) {
        removeSafeStorage('apex_products');
        removeSafeStorage('apex_my_orders');
        
        if (typeof renderProductsGrid === 'function') renderProductsGrid();
        if (typeof renderProducts === 'function') renderProducts();
        if (typeof renderAdminInventoryList === 'function') renderAdminInventoryList();
        if (typeof renderAdminOrdersList === 'function') renderAdminOrdersList();

        showToast("All data cleared successfully!", "");
    }
}
// Open and Close Overlay Functions
function openSearchOverlay() {
    document.getElementById('searchOverlay').classList.add('active');
    document.getElementById('overlaySearchInput').focus();
    renderSearchHistory();
}

function closeSearchOverlay() {
    document.getElementById('searchOverlay').classList.remove('active');
}

// Save Search Query to LocalStorage
function saveSearchQuery(query) {
    if (!query.trim()) return;
    
    let history = JSON.parse(localStorage.getItem('apex_search_history')) || [];
    
    // Duplicate हटाने के लिए
    history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
    
    // शुरुआत में नया सर्च जोड़ने के लिए
    history.unshift(query);
    
    // अधिकतम 10 रिसेंट सर्च सेव रखें
    if (history.length > 10) history.pop();
    
    localStorage.setItem('apex_search_history', JSON.stringify(history));
}

// Render History Items in Overlay
function renderSearchHistory() {
    const historyContainer = document.getElementById('historyContainer');
    let history = JSON.parse(localStorage.getItem('apex_search_history')) || [];
    
    historyContainer.innerHTML = '';

    if (history.length === 0) {
        historyContainer.innerHTML = ''; // यदि कोई सर्च नहीं हुआ तो पूरा खाली रहेगा
        return;
    }

    history.forEach((term, index) => {
        const itemHtml = `
            <div class="history-item">
                <div class="history-item-left" onclick="executeSearch('${term}')">
                    <span class="history-clock-icon">🕒</span>
                    <span>${term}</span>
                </div>
                <button class="delete-history-btn" onclick="removeHistoryItem(event, ${index})">✕</button>
            </div>
        `;
        historyContainer.insertAdjacentHTML('beforeend', itemHtml);
    });
}

// Remove Single History Item
function removeHistoryItem(event, index) {
    event.stopPropagation();
    let history = JSON.parse(localStorage.getItem('apex_search_history')) || [];
    history.splice(index, 1);
    localStorage.setItem('apex_search_history', JSON.stringify(history));
    renderSearchHistory();
}

// Execute Search on Pressing Enter (Fixed Optional Check)
const searchInput = document.getElementById('overlaySearchInput');
if (searchInput) {
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const query = this.value;
            if (query.trim()) {
                saveSearchQuery(query);
                executeSearch(query);
            }
        }
    });
}

function executeSearch(query) {
    alert("Searching for: " + query); // अपनी सर्च फ़िल्टरिंग का कोड यहाँ चलाएँ
    closeSearchOverlay();
}
// Master Function: Close everything and return to Store (Home)
function goHomeAndCloseAll() {
    // 1. All Modals & Overlays Hide karo
    const allModals = document.querySelectorAll('.modal-overlay, .search-overlay, #cartModal, #ordersModal, #profileModal, #supportModal, #searchOverlay');
    allModals.forEach(modal => {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
    });

    // 2. Bottom Nav Highlights Reset karke 'Store' ko Active karo
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    const storeBtn = document.querySelector('.bottom-nav .nav-item:first-child');
    if (storeBtn) {
        storeBtn.classList.add('active');
    }
}

// Global Close bindings
function closeAllModals() { goHomeAndCloseAll(); }
function closeCartModal() { goHomeAndCloseAll(); }
function closeOrdersModal() { goHomeAndCloseAll(); }
function closeProfileModal() { goHomeAndCloseAll(); }
function closeSupportModal() { goHomeAndCloseAll(); }
function closeSearchOverlay() { goHomeAndCloseAll(); }
function goHomeAndCloseAll() {
    // Cross (✕) दबाने पर Back जाने का सिंपल कोड
function goBackAndClose() {
    // 1. सभी पॉपअप/मॉडल्स को छुपाएं
    const allModals = document.querySelectorAll('.modal-overlay, .search-overlay, #cartModal, #ordersModal, #profileModal, #supportModal, #searchOverlay');
    allModals.forEach(modal => {
        modal.classList.remove('active');
        modal.style.display = 'none';
    });

    // 2. Browser / Page History में एक कदम पीछे (Back) जाएं
    window.history.back();
}
}
function closeAllModals() {
    // 1. जितने भी पॉपअप हैं, उन सबको स्क्रीन से गायब कर दो
    let modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(function(modal) {
        modal.style.setProperty('display', 'none', 'important');
    });

    // 2. नीचे वाले नेविगेशन बार में वापस 'Store' को नीला (Active) कर दो
    let navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(function(item) {
        item.classList.remove('active');
    });
    
    let storeBtn = document.querySelector('.bottom-nav .nav-item:first-child');
    if(storeBtn) {
        storeBtn.classList.add('active');
    }
}
// यह फंक्शन किसी भी खुले हुए पॉपअप को तुरंत बंद कर देगा
function closePopup() {
    // 1. सारे Modals और Overlays ढूँढकर बंद करो
    document.querySelectorAll('.modal-overlay, .modal, .search-overlay, [class*="modal"], [class*="overlay"]').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
        el.classList.remove('active', 'show');
    });

    // 2. बॉटम नेविगेशन में 'Store' को दोबारा एक्टिव करो
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    const storeBtn = document.querySelector('.bottom-nav .nav-item:first-child');
    if (storeBtn) storeBtn.classList.add('active');
}
function closePopup() {
    document.querySelectorAll('.modal-overlay, .modal, .search-overlay').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active', 'show');
    });
}
function closeAndGoToSearch() {
    // 1. Cart और Orders दोनों मॉडल्स को बंद करें
    const cartModal = document.getElementById('cartModal');
    const ordersModal = document.getElementById('ordersModal');
    
    if (cartModal) {
        cartModal.style.display = 'none';
        cartModal.classList.remove('active');
    }
    if (ordersModal) {
        ordersModal.style.display = 'none';
        ordersModal.classList.remove('active');
    }

    // 2. होम पेज के टॉप पर स्क्रॉल करें
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 3. अगर सर्च ओवरले फ़ंक्शन मौजूद है, तो उसे चलाएं
    if (typeof openSearchOverlay === 'function') {
        openSearchOverlay();
    } else {
        // अगर सर्च ओवरले नहीं बना है तो मुख्य सर्च इनपुट पर फ़ोकस करें
        const mainSearchInput = document.querySelector('.main-search-bar input');
        if (mainSearchInput) {
            mainSearchInput.focus();
            mainSearchInput.click();
        }
    }
}
// LocalStorage से रीसेंट सर्च गेट करना
function getRecentSearches() {
    const history = localStorage.getItem('apex_recent_searches');
    return history ? JSON.parse(history) : [];
}

// LocalStorage में नया सर्च सेव करना
function saveSearchTerm(term) {
    if (!term || term.trim() === '') return;
    let searches = getRecentSearches();
    // duplicate हटाएँ और नए सर्च को सबसे ऊपर रखें
    searches = searches.filter(item => item.toLowerCase() !== term.toLowerCase());
    searches.unshift(term.trim());
    // सिर्फ़ आख़िरी 5 सर्च ही रखें
    if (searches.length > 5) searches.pop();
    localStorage.setItem('apex_recent_searches', JSON.stringify(searches));
}

// सर्च ओवरले रेंडर करना (डायनामिक रीसेंट सर्च + ट्रेंडिंग प्रोडक्ट्स)
function renderSearchHistory() {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer) return;

    const recentSearches = getRecentSearches();
    
    // ट्रेंडिंग कैटेगरीज और ट्रेंडिंग प्रोडक्ट्स (इमोजी फ्री)
    const trendingCategories = ['Electronics', 'Men Fashion', 'Mobile Accessories'];
    const trendingProducts = ['Wireless Earbuds', 'Smart Watch', 'Gaming Laptop'];

    let html = '';

    // केवल तभी Recent Searches दिखाएगा जब यूजर ने पहले कभी कुछ सर्च किया हो
    if (recentSearches.length > 0) {
        html += `
            <div class="search-section">
                <div class="search-section-title" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Recent Searches</span>
                    <span onclick="clearRecentSearches()" style="font-size: 11px; color: #2563eb; cursor: pointer; text-transform: none;">Clear All</span>
                </div>
                <ul class="search-list">
                    ${recentSearches.map(item => `
                        <li onclick="selectSearchTerm('${item}')">
                            <span class="history-icon">↺</span>
                            <span class="search-text">${item}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Trending Products Section
    html += `
        <div class="search-section">
            <div class="search-section-title">Trending Products</div>
            <ul class="search-list">
                ${trendingProducts.map(item => `
                    <li onclick="selectSearchTerm('${item}')">
                        <span class="history-icon">★</span>
                        <span class="search-text">${item}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    // Trending Categories Section
    html += `
        <div class="search-section">
            <div class="search-section-title">Trending Categories</div>
            <ul class="search-list">
                ${trendingCategories.map(item => `
                    <li onclick="selectSearchTerm('${item}')">
                        <span class="history-icon">↗</span>
                        <span class="search-text">${item}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    historyContainer.innerHTML = html;
}

// किसी आइटम पर क्लिक करने पर उसे सर्च में डालना और सेव करना
function selectSearchTerm(term) {
    const searchInput = document.getElementById('overlaySearchInput');
    if (searchInput) {
        searchInput.value = term;
        saveSearchTerm(term);
    }
}

// रीसेंट सर्च क्लियर करने का फंक्शन
function clearRecentSearches() {
    localStorage.removeItem('apex_recent_searches');
    renderSearchHistory();
}

// जब यूज़र सर्च इनपुट में 'Enter' दबाए
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('overlaySearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    saveSearchTerm(query);
                    // यहाँ आपकी प्रोडक्ट फ़िल्टरिंग या सर्च का फ़ंक्शन कॉल कर सकते हैं
                }
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    renderHorizontalProducts();
});

function renderHorizontalProducts() {
    const slider1 = document.getElementById('sliderRow1');
    const slider2 = document.getElementById('sliderRow2');


    if (slider1) {
        slider1.innerHTML = productsRow1.map(p => createProductCardHtml(p)).join('');
    }

    if (slider2) {
        slider2.innerHTML = productsRow2.map(p => createProductCardHtml(p)).join('');
    }
}

function createProductCardHtml(product) {
    return `
        <div class="product-card-item">
            <img src="${product.img}" alt="${product.name}" class="product-card-img">
            <div class="product-card-title">${product.name}</div>
            <div class="product-card-price">${product.price}</div>
            <button class="product-add-btn">Add to Cart</button>
        </div>
    `;
}
document.addEventListener('DOMContentLoaded', function() {
    renderProducts();
});

function renderProducts() {
    const container = document.getElementById('mainProductsRow');
    if (!container) return;

    const products = [
        { name: 'Wireless Headphones', price: '₹1,999' },
        { name: 'Smart Watch', price: '₹2,499' },
        { name: 'Bluetooth Speaker', price: '₹1,299' },
        { name: 'Gaming Mouse', price: '₹899' },
        { name: 'Fast Charger', price: '₹499' }
    ];

    container.innerHTML = products.map(p => `
        <div style="flex: 0 0 130px !important; min-width: 130px !important; width: 130px !important; box-sizing: border-box !important; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;"> 
            <div style="width: 100%; height: 90px; background: #f3f4f6; border-radius: 6px; margin-bottom: 8px;"></div>
            <div style="font-size: 12px; font-weight: 600; color: #111; margin-bottom: 4px; text-overflow: ellipsis; overflow: hidden; whitespace: nowrap;">${p.name}</div>
            <div style="font-size: 13px; font-weight: 700; color: #2563eb;">${p.price}</div>
        </div>
    `).join('');
}
function renderProducts() {
    const container = document.getElementById('mainProductsRow');
    if (!container) return;

    const products = [
        { name: 'Wireless Headphones', price: '₹1,999', image: '' },
        { name: 'Smart Watch', price: '₹2,499', image: '' },
        { name: 'Bluetooth Speaker', price: '₹1,299', image: '' },
        { name: 'Gaming Mouse', price: '₹899', image: '' },
        { name: 'Fast Charger', price: '₹499', image: '' }
    ];

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-img-wrapper">
                <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}">
            </div>
            <div class="product-title">${product.name}</div>
            <div class="product-price">${product.price}</div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', renderProducts);
function openProfilePage() {
    // 1. स्टोर की बाकी चीज़ें छुपाएं
    const allElements = document.body.children;
    for (let el of allElements) {
        if (el.id !== 'profilePage' && el.tagName !== 'SCRIPT' && !el.classList.contains('bottom-nav')) {
            el.style.setProperty('display', 'none', 'important');
        }
    }

    // 2. प्रोफाइल पेज को दिखाएं
    const profilePage = document.getElementById('profilePage');
    if (profilePage) {
        profilePage.style.setProperty('display', 'block', 'important');
        profilePage.style.setProperty('visibility', 'visible', 'important');
        profilePage.style.setProperty('opacity', '1', 'important');
    }

    // 3. बॉटम नेव एक्टिव करें
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    const profileBtn = document.querySelector('.bottom-nav .nav-item[onclick*="openProfilePage"]');
    if (profileBtn) profileBtn.classList.add('active');
}
function openAdminModal() {
    // अगर एडमिन पैनल का अलग मोडल/पॉपअप है तो उसे खोलें
    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
        adminModal.style.display = 'block';
        adminModal.classList.add('active');
    } else {
        alert('Admin Panel Connected!');
    }
}
// Tab Navigation Switcher Fix
function switchTab(tabName) {
    // Hide all main pages/sections
    const sections = ['storePage', 'supportPage', 'cartPage', 'ordersPage', 'profilePage', 'profile-section', 'profile-container'];
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.style.display = 'none';
        }
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-item, .bottom-nav a, .bottom-nav button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show target tab
    if (tabName === 'profile') {
        const profileEl = document.getElementById('profilePage') || document.getElementById('profile-section') || document.querySelector('.profile-container');
        if (profileEl) {
            profileEl.classList.add('active');
            profileEl.style.display = 'flex';
        }
    } else {
        const targetEl = document.getElementById(tabName + 'Page') || document.getElementById(tabName);
        if (targetEl) {
            targetEl.classList.add('active');
            targetEl.style.display = 'block';
        }
    }
}

// Bind clicks to bottom navigation
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item, .bottom-nav a, .bottom-nav button');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const text = this.innerText.toLowerCase().trim();
            if (text.includes('store')) switchTab('store');
            else if (text.includes('support')) switchTab('support');
            else if (text.includes('cart')) switchTab('cart');
            else if (text.includes('orders')) switchTab('orders');
            else if (text.includes('profile')) switchTab('profile');
        });
    });
});
// Safe Storage Helpers
function getSafeData(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console
        return fallback;
    }                        
}

function setSafeData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('localStorage write failed.');
    }
}

// Account Settings Handler
document.addEventListener('DOMContentLoaded', loadUserProfile);

function loadUserProfile() {
    const savedUser = getSafeData('apex_user_profile', {
        name: 'Alex Dev',
        email: 'alex.apex@app.com',
        phone: '',
        avatar: ''
    });

    document.querySelectorAll('.profile-card h2, .profile-name, .user-name').forEach(el => el.textContent = savedUser.name);
    document.querySelectorAll('.profile-card p, .profile-email, .user-email').forEach(el => el.textContent = savedUser.email);
    if (savedUser.avatar) {
        document.querySelectorAll('.profile-avatar-container img, .avatar-wrapper img, .profile-card img').forEach(el => el.src = savedUser.avatar);
    }
}

function openAccountSettings() {
    const savedUser = getSafeData('apex_user_profile', {
        name: 'Alex Dev',
        email: 'alex.apex@app.com',
        phone: '',
        avatar: ''
    });

    if (document.getElementById('settingUserName')) document.getElementById('settingUserName').value = savedUser.name || '';
    if (document.getElementById('settingUserEmail')) document.getElementById('settingUserEmail').value = savedUser.email || '';
    if (document.getElementById('settingUserPhone')) document.getElementById('settingUserPhone').value = savedUser.phone || '';
    if (document.getElementById('settingUserAvatar')) document.getElementById('settingUserAvatar').value = savedUser.avatar || '';

    const modal = document.getElementById('accountSettingsModal');
    if (modal) modal.classList.add('active');
}

function closeAccountSettings() {
    const modal = document.getElementById('accountSettingsModal');
    if (modal) modal.classList.remove('active');
}

function saveAccountSettings(event) {
    if (event) event.preventDefault();

    const updatedUser = {
        name: document.getElementById('settingUserName')?.value.trim() || 'Alex Dev',
        email: document.getElementById('settingUserEmail')?.value.trim() || 'alex.apex@app.com',
        phone: document.getElementById('settingUserPhone')?.value.trim() || '',
        avatar: document.getElementById('settingUserAvatar')?.value.trim() || ''
    };

    setSafeData('apex_user_profile', updatedUser);
    loadUserProfile();
    closeAccountSettings();

    if (typeof showToast === 'function') {
        showToast("Profile updated successfully!", "success");
    } else {
        alert("Profile updated successfully!");
    }
}

// Click listener for Account Settings button
document.addEventListener('click', function(e) {
    const target = e.target.closest('div, button, a, li');
    if (target && target.innerText && target.innerText.includes('Account Settings')) {
        e.preventDefault();
        openAccountSettings();
    }
});

window.openAccountSettings = openAccountSettings;
window.closeAccountSettings = closeAccountSettings;
window.saveAccountSettings = saveAccountSettings;
function openAccountSettings() {
    const modal = document.getElementById('accountSettingsModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex'; // गारंटी से पॉपअप शो करने के लिए
    }
}

window.openAccountSettings = openAccountSettings;
// मोडल (Account Settings) को बंद करने का फंक्शन
function closeAccountSettings() {
    const modal = document.getElementById('accountSettingsModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none'; // मोडल को पूरी तरह छुपाने के लिए
    }
}

window.closeAccountSettings = closeAccountSettings;
const imageInput = document.getElementById('modalImageUpload');
const fileNamePreview = document.getElementById('fileNamePreview');

if (imageInput) {
    imageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            fileNamePreview.textContent = this.files[0].name;
        } else {
            fileNamePreview.textContent = 'No file chosen';
        }
    });
}
