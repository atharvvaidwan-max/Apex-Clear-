// APEX CLEAR - SAFE STORAGE & CORE ENGINE (PART 1)

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
    const adminModal = document.getElementById('adminModal');
    const authSection = document.getElementById('adminAuthSection');
    const controlPanel = document.getElementById('adminControlPanel');
    const title = document.getElementById('adminModalTitle');
    
    if (!adminModal || !authSection || !controlPanel || !title) return;

    adminModal.style.display = "block";
    controlPanel.style.display = "none";
    authSection.style.display = "block";

    const savedPassword = getSafeStorage('apex_admin_password', null);
    if (!savedPassword) {
        title.innerText = "Admin Setup - Create Password";
    } else {
        title.innerText = "Admin Security - Login";
    }
}

function closeAdminPanel() {
    const adminModal = document.getElementById('adminModal');
    const authForm = document.getElementById('adminAuthForm');
    if (adminModal) adminModal.style.display = "none";
    if (authForm) authForm.reset();
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
    document.getElementById('adminAuthSection').style.display = "none";
    document.getElementById('adminControlPanel').style.display = "block";
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
// APEX CLEAR - ADMIN INVENTORY, UI & CHECKOUT (PART 2)

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

// Ensure saved theme is applied when page loads
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('apex_theme');
    if (savedTheme === 'light') {
        toggleTheme();
    }
});


// CART & ORDERS SUMMARY
function openCartSummary() {
    if (cart.length === 0) {
        showCustomModal("Cart", "Your cart is currently empty.");
        return;
    }
    let htmlContent = "<ul style='list-style: none; padding: 0;'>";
    cart.forEach((item, index) => {
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
    orders.forEach((ord, index) => {
        htmlContent += `<div style='padding: 10px; margin-bottom: 8px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 6px;'>
            <div style='font-weight: bold; color: var(--heading-color);'>${ord.name}</div>
            <div style='font-size: 12px; color: #8b949e;'>Price: ${ord.price} | Date: ${ord.date}</div>
        </div>`;
    });
    htmlContent += "</div>";
    showCustomModal("Order History", htmlContent);
}

function searchProducts() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        if (title.includes(input)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
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

// TOAST NOTIFICATION SYSTEM
function showToast(message) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.innerText = message;
    toast.classList.add("show");
    
    setTimeout(function() { 
        toast.classList.remove("show");
    }, 2500);
}
// ======================================================
// पुराने script.js के ठीक नीचे केवल इसे पेस्ट (Paste) करें
// ======================================================

// 1. एडमिन स्टैटिस्टिक्स / डैशबोर्ड एनैलिटिक्स
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

// 2. डिस्काउंट और कूपन कोड लॉजिक (e.g. APEX10 या APEX20)
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

// 3. एडमिन के लिए स्टोर डेटा बैकअप (JSON Export)
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
// OPEN & CLOSE SUPPORT MODAL
function openSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.style.display = 'block';
}

function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.style.display = 'none';
}

// SUPPORT FORM SUBMISSION LOGIC
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

    // Limit Max 10 per Horizontal Row
    const row1Products = products.slice(0, 10);
    const row2Products = products.slice(10, 20);

    const createCardHTML = (p) => `
        <div class="product-card">
            <span class="stock-badge">Stock: ${p.stock}</span>
            <img src="${p.image}" alt="${p.title}" class="product-img" onerror="this.src='https://via.placeholder.com/150'">
            <div class="product-info">
                <h4 class="product-title">${p.title}</h4>
                <p class="product-desc">${p.description}</p>
                <div class="product-price">${p.price}</div>
                <button class="btn-primary buy-btn" onclick="triggerCheckoutModal('${p.title}', '${p.price}')">Buy via COD</button>
                <button class="btn-primary cart-btn" style="background:#30363d; margin-top:5px;" onclick="addToCart('${p.title}', '${p.price}')">+ Add to Cart</button>
            </div>
        </div>
    `;

    trendingGrid.innerHTML = row1Products.map(createCardHTML).join('');
    featuredGrid.innerHTML = row2Products.map(createCardHTML).join('');

    if (fullGrid) {
        fullGrid.innerHTML = products.map(createCardHTML).join('');
    }
}

// SEE MORE TOGGLE FUNCTION
function seeMoreProducts(type) {
    const container = document.getElementById('allProductsContainer');
    if (container) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

// AUTO-CALL ON LOAD
document.addEventListener('DOMContentLoaded', renderProducts);
// ======================================================
// ENHANCEMENTS: WISHLIST, SEARCH FILTER & CART QUANTITY
// ======================================================

// 1. LIVE SEARCH & CATEGORY FILTERING
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const products = getStoredProducts();
    const filtered = products.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
    );

    renderFilteredProducts(filtered);
}

function filterByCategory(categoryName) {
    if (!categoryName) return;
    const products = typeof getStoredProducts === 'function' ? getStoredProducts() : [];
    
    // category चेक करके फिल्टर
    const filtered = products.filter(p => 
        p && p.category && String(p.category).toLowerCase() === String(categoryName).toLowerCase()
    );

    // अगर कैटेगरी नहीं मिली तो टाइटल में ढूँढो (Safe Optional Chaining)
    const fallbackFiltered = filtered.length > 0 ? filtered : products.filter(p => 
        p && p.title && String(p.title).toLowerCase().includes(String(categoryName).toLowerCase())
    );

    if (typeof renderFilteredProducts === 'function') {
        renderFilteredProducts(fallbackFiltered);
    }
    
    if (typeof showToast === 'function') {
        showToast(`Showing products for: ${categoryName}`);
    }
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
                    <button class="wishlist-btn" onclick="toggleWishlist('${p.title}')">&#9829;</button>
                    <span class="stock-badge">Stock: ${p.stock}</span>
                    <img src="${p.image}" alt="${p.title}" class="product-img" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="product-info">
                        <h4 class="product-title">${p.title}</h4>
                        <div class="product-rating">&#9733; 4.5 <span>(24 reviews)</span></div>
                        <p class="product-desc">${p.description}</p>
                        <div class="product-price">${p.price}</div>
                        <button class="btn-primary buy-btn" onclick="triggerCheckoutModal('${p.title}', '${p.price}')">Buy via COD</button>
                        <button class="btn-primary cart-btn" style="background:#30363d; margin-top:5px;" onclick="addToCart('${p.title}', '${p.price}')">+ Add to Cart</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// 2. WISHLIST SYSTEM
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

// 3. TOAST NOTIFICATION HELPER
function showToast(message) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2500);
}
// ======================================================
// ENHANCEMENTS: WISHLIST, SEARCH FILTER & TOAST NOTIFICATION
// ======================================================

// 1. LIVE SEARCH & CATEGORY FILTERING
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const products = getStoredProducts();
    const filtered = products.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
    );

    renderFilteredProducts(filtered);
}

function filterByCategory(categoryName) {
    const products = getStoredProducts();
    const filtered = products.filter(p => 
        p.category && p.category.toLowerCase() === categoryName.toLowerCase()
    );
    
    const fallbackFiltered = filtered.length > 0 ? filtered : products.filter(p => 
        p.title.toLowerCase().includes(categoryName.toLowerCase())
    );

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
                    <button class="wishlist-btn" onclick="toggleWishlist('${p.title}')">&#9829;</button>
                    <span class="stock-badge">Stock: ${p.stock}</span>
                    <img src="${p.image}" alt="${p.title}" class="product-img" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="product-info">
                        <h4 class="product-title">${p.title}</h4>
                        <div class="product-rating">&#9733; 4.5 <span>(24 reviews)</span></div>
                        <p class="product-desc">${p.description}</p>
                        <div class="product-price">${p.price}</div>
                        <button class="btn-primary buy-btn" onclick="triggerCheckoutModal('${p.title}', '${p.price}')">Buy via COD</button>
                        <button class="btn-primary cart-btn" style="background:#30363d; margin-top:5px;" onclick="addToCart('${p.title}', '${p.price}')">+ Add to Cart</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// 2. WISHLIST SYSTEM
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

// 3. TOAST NOTIFICATION HELPER
function showToast(message) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2500);
}
function toggleMenu() {
    const nav = document.getElementById('navMenu');
    const btn = document.querySelector('.hamburger-btn');
    
    if (nav && btn) {
        nav.classList.toggle('open');
        btn.classList.toggle('active');
    }
}

// Close menu if clicked outside
document.addEventListener('click', (e) => {
    const header = document.querySelector('header');
    const nav = document.getElementById('navMenu');
    if (header && nav && !header.contains(e.target) && nav.classList.contains('open')) {
        toggleMenu();
    }
});
function togglePaymentUI() {
    const method = document.getElementById('paymentMethod').value;
    const upiBox = document.getElementById('upiPaymentBox');
    if (method === 'UPI') {
        upiBox.style.display = 'block';
    } else {
        upiBox.style.display = 'none';
    }
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function processRealOrder(event) {
    event.preventDefault();

    const name = document.getElementById('shipName').value;
    const phone = document.getElementById('shipPhone').value;
    const address = document.getElementById('shipAddress').value;
    const city = document.getElementById('shipCity').value;
    const state = document.getElementById('shipState').value;
    const pincode = document.getElementById('shipPincode').value;
    const payment = document.getElementById('paymentMethod').value;
    const utr = document.getElementById('upiTransactionId') ? document.getElementById('upiTransactionId').value : 'N/A';

    const fullAddress = `${address}, ${city}, ${state} - ${pincode}`;
    
    // Get existing orders or initialize array
    let orders = JSON.parse(localStorage.getItem('apex_orders') || '[]');
    
    const newOrder = {
        orderId: 'APX-' + Math.floor(100000 + Math.random() * 900000),
        customerName: name,
        phone: phone,
        address: fullAddress,
        paymentMethod: payment,
        utrNumber: utr,
        date: new Date().toLocaleDateString('en-IN'),
        status: 'Order Placed (Pending Shipping)'
    };

    orders.push(newOrder);
    localStorage.setItem('apex_orders', JSON.stringify(orders));

    alert(` Order Placed Successfully!\n\nOrder ID: ${newOrder.orderId}\nWe will deliver to: ${fullAddress}`);
    closeCheckoutModal();
    
    // Refresh Admin Orders List if open
    if(typeof renderAdminOrders === 'function') {
        renderAdminOrders();
    }
}
function openCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}
// एडमिन पैनल बंद करने का फ़ंक्शन
function closeAdminPanel() {
    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
        adminModal.setAttribute('style', 'display: none !important;');
    }
}

// कस्टमर सपोर्ट पैनल बंद करने का फ़ंक्शन
function closeSupportModal() {
    const supportModal = document.getElementById('supportModal');
    if (supportModal) {
        supportModal.setAttribute('style', 'display: none !important;');
    }
}

// चेकआउट पैनल बंद करने का फ़ंक्शन
function closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.setAttribute('style', 'display: none !important;');
    }
}

// अगर यूज़र पॉप-अप के बाहर कहीं भी काली स्क्रीन पर क्लिक करे, तब भी पॉप-अप बंद हो जाए
window.onclick = function(event) {
    const adminModal = document.getElementById('adminModal');
    const supportModal = document.getElementById('supportModal');
    const checkoutModal = document.getElementById('checkoutModal');

    if (event.target === adminModal) {
        closeAdminPanel();
    }
    if (event.target === supportModal) {
        closeSupportModal();
    }
    if (event.target === checkoutModal) {
        closeCheckoutModal();
    }
};
function processRealOrder(event) {
    event.preventDefault();

    // कस्टमर की डिटेल्स
    const name = document.getElementById('shipName').value;
    const phone = document.getElementById('shipPhone').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const amount = 499; // तुम्हारा प्रोडक्ट प्राइस

    if (paymentMethod === 'COD') {
        alert('🎉 Cash on Delivery Order Successful!');
        closeCheckoutModal();
        return;
    }

    // तुम्हारा असली UPI ID (यहाँ अपना UPI ID लिखो)
    const myUpiId = "YOURNAME@upi"; 

    // ऑटोमैटिक QR Code URL
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${myUpiId}&pn=APEX%20CLEAR&am=${amount}&cu=INR`;

    // QR Code पॉप-अप में दिखाओ
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
