/* app.js
   Demo booking UI logic (mobile-first)
   - mock data for services / collaborators and availability
   - add to cart, pager for services (pages of 6)
   - cart drawer with select barber, date scroller and hours by morning/afternoon/night
*/

const SERVICES_PER_PAGE = 6;
const API_URL = "https://script.google.com/macros/s/AKfycbwL-U9FOkZp1c986_7YY6EhbHliBg72BaoZvl6HeXIreZPZ70qF-niWR7ZOVL-C0zBZ/exec";

/* ---------- MOCK DATA (edítalo según necesites) ---------- */

const services = [
  { id: 's1', title: 'CORTE Y BARBA TRADICIONAL', desc: 'servicio especializado de corte de cabello y afeitado de barbas', price: 40000, time:45, category:'servicio_clasico', popular:true },
  { id: 's2', title: 'PREMIUM FRECUENTES', desc: 'asesoría y visigismo\nlavado de cabello\nmasajes capilares', price:25000, time:35, category:'premium', popular:true, img:true },
  { id: 's3', title: 'CORTE NIÑO', desc: 'corte especial para niños', price:22000, time:30, category:'servicio_clasico' },
  { id: 's4', title: 'RETOQUE BARBA', desc: 'perfilado y arreglo', price:15000, time:20, category:'servicio_clasico' },
  { id: 's5', title: 'COLOR & ESTILO', desc: 'tintes y estilizado', price:70000, time:60, category:'premium' },
  { id: 's6', title: 'AFEITADO TRADICIONAL', desc: 'afeitado con navaja', price:32000, time:35, category:'servicio_clasico' },
  { id: 's7', title: 'CORTES EXPRESS', desc: 'corte rápido 20 minutos', price:18000, time:20, category:'servicio_clasico' },
  { id: 's8', title: 'TRATAMIENTO CAPILAR', desc: 'hidratación profunda', price:38000, time:40, category:'premium' },
];

const collaborators = [
  { id:'c1', name:'feder hernandez', avatar:'images/barbero1.jpg' },
  { id:'c2', name:'juan pérez', avatar:'images/barbero2.jpg' },
  { id:'c3', name:'cami ruiz', avatar:'images/barbero3.jpg' },
];

/* ---------- Helpers ---------- */
function formatCurrency(n){
  return '$ ' + (n).toLocaleString('es-CO');
}

function pad(n){ return n < 10 ? '0'+n : ''+n; }
function dateToYMD(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

/* ---------- Application State ---------- */
let state = {
  filtered: services.slice(),
  page: 1,
  pageCount: 1,
  cart: [], // {serviceId, qty, serviceObj}
  selectedCollaborator: null,
  selectedDate: null,
  selectedTime: null,
};

/* ---------- Rendering services with pagination ---------- */
function renderServices(){
  const list = document.getElementById('services-list');
  const search = document.getElementById('search').value.trim().toLowerCase();
  const activeCat = document.querySelector('.pill.active')?.dataset.cat || 'all';

  // filter
  state.filtered = services.filter(s=>{
    if(activeCat!=='all' && s.category !== activeCat) return false;
    if(!search) return true;
    return (s.title + ' ' + (s.desc||'')).toLowerCase().includes(search);
  });

  state.pageCount = Math.max(1, Math.ceil(state.filtered.length / SERVICES_PER_PAGE));
  if(state.page > state.pageCount) state.page = state.pageCount;

  const start = (state.page-1) * SERVICES_PER_PAGE;
  const slice = state.filtered.slice(start, start + SERVICES_PER_PAGE);

  list.innerHTML = '';
  for(const s of slice){
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="meta">
        <span class="badge">${s.popular?'<span>🔥 POPULAR</span>':''}</span>
        <div class="time">${s.time} min</div>
      </div>
      <div class="title">${s.title}</div>
      <div class="desc">${s.desc ? s.desc.replace(/\n/g,'<br>') : ''}</div>
      <div class="price-row">
        <div>
          <div style="font-size:12px;color:var(--muted);margin-top:8px">Price</div>
          <div class="price">${formatCurrency(s.price)}</div>
        </div>
        <div>
          <button class="add-btn" data-id="${s.id}">Añadir</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  }

  // pager UI
  document.getElementById('page-indicator').textContent = `${state.page} / ${state.pageCount}`;
  document.getElementById('prev-page').disabled = state.page <= 1;
  document.getElementById('next-page').disabled = state.page >= state.pageCount;

  // bind add buttons
  list.querySelectorAll('.add-btn').forEach(b=>{
    b.onclick = () => addToCart(b.dataset.id);
  });
}

/* ---------- Cart logic ---------- */
function addToCart(serviceId){
  const existing = state.cart.find(c=>c.serviceId===serviceId);
  if(existing){
    existing.qty++;
  } else {
    const service = services.find(s=>s.id===serviceId);
    state.cart.push({serviceId:serviceId, qty:1, serviceObj:service});
  }
  renderCart();
}

function removeFromCart(serviceId){
  state.cart = state.cart.filter(c=>c.serviceId!==serviceId);
  renderCart();
}

function changeQty(serviceId, delta){
  const item = state.cart.find(c=>c.serviceId===serviceId);
  if(!item) return;
  item.qty += delta;
  if(item.qty<=0) removeFromCart(serviceId);
  renderCart();
}

function renderCart(){
  const container = document.getElementById('cart-contents');
  const cartCount = document.getElementById('cart-count');
  const nextBtn = document.getElementById('next-step');

  container.innerHTML = '';

  if(state.cart.length === 0){
    container.innerHTML = '<p class="empty">Tu carrito está vacío</p>';
    cartCount.textContent = '0';
    nextBtn.classList.add('disabled');
    return;
  } else {
    nextBtn.classList.remove('disabled'); // habilitado si hay servicios
  }

  let total = 0;
  const list = document.createElement('div');
  list.className = 'cart-list';

  for(const item of state.cart){
    const s = item.serviceObj;
    total += s.price * item.qty;

    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="cart-info">
        <div class="cart-title">${s.title}</div>
        <div class="cart-sub">${formatCurrency(s.price)} x ${item.qty}</div>
      </div>
      <div class="cart-actions">
        <button class="qty-btn" data-action="dec" data-id="${s.id}">-</button>
        <span class="qty">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-id="${s.id}">+</button>
        <button class="remove-btn" data-id="${s.id}">✕</button>
      </div>
    `;
    list.appendChild(row);
  }

  container.appendChild(list);

  const totalRow = document.createElement('div');
  totalRow.className = 'cart-total';
  totalRow.innerHTML = `<strong>Total:</strong> ${formatCurrency(total)}`;
  container.appendChild(totalRow);

  cartCount.textContent = state.cart.reduce((sum, c) => sum + c.qty, 0);
  cartCount.classList.add("bump");
  setTimeout(() => cartCount.classList.remove("bump"), 300);

  // bind qty & remove
  container.querySelectorAll('.qty-btn').forEach(btn=>{
    btn.onclick = ()=> changeQty(btn.dataset.id, btn.dataset.action==='inc'?1:-1);
  });
  container.querySelectorAll('.remove-btn').forEach(btn=>{
    btn.onclick = ()=> removeFromCart(btn.dataset.id);
  });
}

/* ---------- Pagination controls ---------- */
document.getElementById('prev-page').addEventListener('click', ()=>{
  if(state.page>1) state.page--;
  renderServices();
});
document.getElementById('next-page').addEventListener('click', ()=>{
  if(state.page < state.pageCount) state.page++;
  renderServices();
});

/* ---------- Filters ---------- */
document.querySelectorAll('.pill').forEach(p=>{
  p.addEventListener('click', e=>{
    document.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    state.page = 1;
    renderServices();
  });
});

/* ---------- Init ---------- */
document.getElementById('search').addEventListener('input', ()=>{
  state.page = 1;
  renderServices();
});

renderServices();
renderCart();

// Toggle drawer
document.getElementById('cart-toggle').addEventListener('click', ()=>{
  document.getElementById('drawer').classList.add('open');
});
document.getElementById('drawer-close').addEventListener('click', ()=>{
  document.getElementById('drawer').classList.remove('open');
});

// Click en Next Pasar al siguiente paso (interfaz de reserva)
document.getElementById('next-step').addEventListener('click', () => {
  if (state.cart.length === 0) return;
    
  // Verificar si ya se llenó booking info
  if (!state.selectedDate || !state.selectedTime) {
    renderBookingStep();
  } else {
    renderClientForm();
  }
});

/* ---------- Booking Step ---------- */
function renderBookingStep() {
  const container = document.getElementById('cart-contents');
  container.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = 'Selecciona fecha y hora';
  container.appendChild(title);

  // 🔹 Lista de barberos
  const barberRow = document.createElement('div');
  barberRow.className = 'barber-list';

  collaborators.forEach(c => {
    const card = document.createElement('div');
    card.className = 'barber-card';
    card.innerHTML = `
      <img src="${c.avatar}" alt="${c.name}">
      <div class="name">${c.name}</div>
    `;

    card.onclick = () => {
      document.querySelectorAll('.barber-card').forEach(b => b.classList.remove('selected'));
      card.classList.add('selected');
      state.selectedCollaborator = c.id;

      // 🚫 resetear hora seleccionada al cambiar de barbero
      state.selectedTime = null;

      // ✅ si ya hay fecha seleccionada, refrescamos horarios automáticamente
      if (state.selectedDate) {
        renderHours(state.selectedDate);
      }
    };
    barberRow.appendChild(card);
  });
  container.appendChild(barberRow);

  // 🔹 Carrusel de fechas
  const datesRow = document.createElement('div');
  datesRow.className = 'dates-row';

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const btn = document.createElement('button');
    btn.className = 'date-btn';
    btn.textContent = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });

    btn.onclick = () => {
      document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedDate = d;

      // 🚫 resetear hora seleccionada al cambiar de fecha
      state.selectedTime = null;

      // ✅ si ya hay barbero seleccionado, refrescamos horarios automáticamente
      if (state.selectedCollaborator) {
        renderHours(d);
      }
    };

    datesRow.appendChild(btn);
  }
  container.appendChild(datesRow);

  // 🔹 Contenedor de horas
  const hoursContainer = document.createElement('div');
  hoursContainer.id = 'hours-container';
  container.appendChild(hoursContainer);

  // 🔹 Función render horas
  async function renderHours(date) {
    if (!state.selectedCollaborator) return;

    const barberId = state.selectedCollaborator;
    const dateKey = dateToYMD(date);

    hoursContainer.innerHTML = '<h4>Horas disponibles:</h4>';

    // loader
    const grid = document.createElement('div');
    grid.className = 'hours-grid';
    grid.innerHTML = '<p>Cargando horarios...</p>';
    hoursContainer.appendChild(grid);

    try {
  const res = await fetch(`${API_URL}?barbero=${barberId}&fecha=${dateKey}`);
  const data = await res.json();

  // ✅ Guardamos el número de WhatsApp del barbero
  state.selectedBarberWhatsapp = data.whatsapp || null;

  // ✅ filtro de seguridad por si backend falla
  data.slots = [...new Set(data.slots.filter(s => !!s))]; // limpia duplicados y vacíos

  grid.innerHTML = '';

  if (data.slots.length === 0) {
    grid.innerHTML = '<p>No hay horas disponibles</p>';
  } else {
    data.slots.forEach(t => {
      const slotBtn = document.createElement('button');
      slotBtn.className = 'slot';
      slotBtn.textContent = t;
      slotBtn.onclick = () => {
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
        slotBtn.classList.add('selected');
        state.selectedTime = t;
      };
      grid.appendChild(slotBtn);
    });
  }
} catch (err) {
  grid.innerHTML = '<p>Error cargando horarios</p>';
}
  }
}

/* ---------- Client Info Step ---------- */ 
function renderClientForm() {
  const container = document.getElementById('cart-contents');
  container.innerHTML = '';

  // 🔙 Botón volver
  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "← Volver al carrito";
  backBtn.onclick = () => renderBookingStep();
  container.appendChild(backBtn);

  const title = document.createElement('h3');
  title.textContent = 'Tus datos de contacto';
  container.appendChild(title);

  const form = document.createElement('div');
  form.className = 'client-form';
  form.innerHTML = `
    <label>Nombre completo</label>
    <input type="text" id="client-name" placeholder="Tu nombre" required>

    <label>Teléfono</label>
    <input type="tel" id="client-phone" placeholder="Tu número" required>
  `;
  container.appendChild(form);

  document.getElementById("next-step").classList.add("disabled");

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'confirm-btn';
  confirmBtn.textContent = 'Finalizar y Confirmar';
  confirmBtn.type = "button";
  confirmBtn.onclick = async () => {
    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    if (!name || !phone) {
      alert('Por favor completa tus datos');
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Agendando...";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        mode:"no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "agendar",
          name,
          phone,
          barber: state.selectedCollaborator,
          date: dateToYMD(state.selectedDate),
          time: state.selectedTime,
          services: state.cart.map(c => c.serviceObj.title),
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert("Error de conexión. Intenta nuevamente");
        // Aquí ya no es necesario redirigir a WhatsApp porque lo hacemos en el bloque catch
      } 
      else {
        alert("❌ Error al agendar la cita.");
      }
    } catch (e) {
      Swal.fire({
      title: '🎉 ¡Cita Agendada!',
      html: `
            <p style="font-size:16px;color:#444">
            Tu cita fue registrada exitosamente.<br>
           <b>Te esperamos en la barbería</b> 💈
          </p>
            `,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
      background: '#f9f9f9',
      backdrop: `rgba(0,0,0,0.5)`,
      timer: 4000,
      timerProgressBar: true
    });
    // Pusimos este codigo Redirigir a WhatsApp Aqui, porque al agendr la cita correctamente en el GS, nos daba este mensae
    //entonces lo usamos para redirigir a WhatsApp. 
        const barber = collaborators.find(c => c.id === state.selectedCollaborator) || { name: "No especificado" };
        const msg = encodeURIComponent(
          `Hola, soy ${name}. Quiero agendar mi cita:\n` +
          `📌 Servicio(s): ${state.cart.map(c => c.serviceObj.title).join(', ')}\n` +
          `👨‍🦱 Barbero: ${barber.name}\n` +
          `📅 Fecha: ${state.selectedDate.toLocaleDateString()}\n` +
          `⏰ Hora: ${state.selectedTime}\n` +
          `📞 Tel: ${phone}`
        );
         // ✅ Número dinámico (si no existe, usamos uno por defecto)
         const whatsapp = state.selectedBarberWhatsapp;

        // ✅ Redirigir a WhatsApp del barbero
        window.location.href = `https://wa.me/${whatsapp}?text=${msg}`;
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Finalizar y Confirmar";
    }
  };
  container.appendChild(confirmBtn);

  const note = document.createElement("p");
  note.innerHTML = `Recuerda estar en camino <span style="color:blue;font-weight:bold;">30 minutos</span> antes`;
  note.style.marginTop = "12px";
  container.appendChild(note);
}
