/*
========================================================================
   BG CARIBE - INTERACTIVE JAVASCRIPT SYSTEM
   Razón Social: BG Transportadora del Caribe S.A. de C.V.
   RNT: 0423005C28259
========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all interactive modules
  initHeaderScroll();
  initMobileMenu();
  initScrollAnimations();
  initXcaretTabs();
  initTestimonialsSlider();
  initDestinationCards();
  checkQuickWidgetParams();
  initTestimonialsModal();
});

/* ========================================================================
   1. HEADER SCROLL SHIFT
   ======================================================================== */
function initHeaderScroll() {
  const header = document.getElementById('mainHeader');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check
}

/* ========================================================================
   2. MOBILE NAVIGATION DRAWER
   ======================================================================== */
function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;

  // Toggle active state
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('active');
    
    // Animate lines to an "X"
    const spans = toggle.querySelectorAll('span');
    if (menu.classList.contains('active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
    } else {
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  });

  // Close when clicking an item
  const menuItems = menu.querySelectorAll('a');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menu.classList.remove('active');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('active');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  });
}

/* ========================================================================
   3. SCROLL ENTRANCE ANIMATIONS
   ======================================================================== */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.scroll-animate');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target); // Trigger only once
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  } else {
    // Fallback if IntersectionObserver is not supported
    animatedElements.forEach(el => el.classList.add('animated'));
  }
}

/* ========================================================================
   4. ECO-LUXURY XCARET TAB CONTROLLER & MEDIA SYNC
   ======================================================================== */
function initXcaretTabs() {
  const tabButtons = document.querySelectorAll('.xcaret-tab-btn');
  const tabContents = document.querySelectorAll('.xcaret-tab-content');
  const activeImage = document.getElementById('xcaretActiveImage');
  const captionTitle = document.getElementById('xcaretCaptionTitle');
  const captionText = document.getElementById('xcaretCaptionText');

  if (!tabButtons.length || !activeImage) return;

  // Configuration for photos and captions
  const tabData = {
    arte: {
      image: 'images/xcaret arte.png',
      title: 'Hotel Xcaret Arte',
      desc: 'Homenaje a los artistas y artesanos mexicanos en una arquitectura eco-integradora frente al mar.'
    },
    mexico: {
      image: 'images/xcaret mexico.png', // Fallback or secondary nice image
      title: 'Hotel Xcaret México',
      desc: 'Un santuario cosmopolita de exuberante naturaleza y caletas de agua cristalina para toda la familia.'
    },
    allfun: {
      image: 'images/all inclusive.png', // Alternating premium visual
      title: 'Concepto All-Fun Inclusive®',
      desc: 'Diversión ilimitada. Entradas y traslados incluidos a los 8 parques naturales de Grupo Xcaret.'
    }
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');

      // Update active tab buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active content panels
      tabContents.forEach(content => {
        if (content.id === `tab-${tabId}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      // Update Image & Text with smooth fade transition
      if (tabData[tabId]) {
        activeImage.style.opacity = '0.3';
        activeImage.style.transform = 'scale(0.97)';
        
        setTimeout(() => {
          activeImage.src = tabData[tabId].image;
          captionTitle.textContent = tabData[tabId].title;
          captionText.textContent = tabData[tabId].desc;
          
          activeImage.style.opacity = '1';
          activeImage.style.transform = 'scale(1)';
        }, 250);
      }
    });
  });
}

/* ========================================================================
   5. CLIENT REVIEWS SLIDER (TESTIMONIALS CAROUSEL)
   ======================================================================== */
function initTestimonialsSlider() {
  const track = document.getElementById('testimonialsTrack');
  const slides = document.querySelectorAll('.testimonial-slide');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carouselDots');

  if (!track || !slides.length) return;

  let currentIndex = 0;
  const slideCount = slides.length;
  let autoPlayTimer;

  // Create dot indicators
  for (let i = 0; i < slideCount; i++) {
    const dot = document.createElement('div');
    dot.classList.add('carousel-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }

  const dots = document.querySelectorAll('.carousel-dot');

  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Update dot indicators
    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function goToSlide(index) {
    currentIndex = index;
    updateCarousel();
    resetAutoPlay();
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slideCount;
    updateCarousel();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slideCount) % slideCount;
    updateCarousel();
  }

  // Click listeners
  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoPlay();
  });

  prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoPlay();
  });

  // Touch support for mobile swiping
  let startX = 0;
  let isSwiping = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
  });

  track.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    const diff = startX - e.touches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      isSwiping = false;
      resetAutoPlay();
    }
  });

  // Auto-play timer
  function startAutoPlay() {
    autoPlayTimer = setInterval(nextSlide, 7000);
  }

  function resetAutoPlay() {
    clearInterval(autoPlayTimer);
    startAutoPlay();
  }

  startAutoPlay();
}

/* ========================================================================
   6. INTERACTIVE DESTINATION CARDS & TABS UTILS
   ======================================================================== */
function initDestinationCards() {
  const cards = document.querySelectorAll('.dest-card');
  const formDestino = document.getElementById('formDestino');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const destName = card.getAttribute('data-destination');
      if (destName && formDestino) {
        // Set values and scroll smoothly
        formDestino.value = destName;
        updateHotelPreferences();
        
        const targetSection = document.getElementById('cotizar');
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth' });
          
          // Micro interaction: highlight form borders briefly
          const formBox = document.getElementById('quoteFormBox');
          if (formBox) {
            formBox.style.borderColor = 'var(--color-accent)';
            formBox.style.boxShadow = '0 24px 48px rgba(209, 172, 112, 0.25)';
            setTimeout(() => {
              formBox.style.borderColor = 'rgba(13, 92, 99, 0.06)';
              formBox.style.boxShadow = 'var(--shadow-lg)';
            }, 1200);
          }
        }
      }
    });
  });
}

// Utility to set preselected options from inside buttons in other sections
window.setPreselectedDestination = function(destination, hotelPref) {
  const formDest = document.getElementById('formDestino');
  const formHotel = document.getElementById('formHotel');
  
  if (formDest) {
    formDest.value = destination;
    updateHotelPreferences();
  }
  if (formHotel && hotelPref) {
    formHotel.value = hotelPref;
  }
  
  const targetSection = document.getElementById('cotizar');
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth' });
  }
};

/* ========================================================================
   7. DYNAMIC HOTEL DROP-DOWN OPTIONS SYNC
   ======================================================================== */
window.updateHotelPreferences = function() {
  const formDest = document.getElementById('formDestino').value;
  const formHotel = document.getElementById('formHotel');
  
  if (!formHotel) return;
  
  // Clear options
  formHotel.innerHTML = '';
  
  const options = {
    'Hoteles Xcaret': [
      { val: 'Hotel Xcaret México', text: 'Hotel Xcaret México (Familiar)' },
      { val: 'Hotel Xcaret Arte', text: 'Hotel Xcaret Arte (Solo Adultos)' },
      { val: 'Solo Todo Incluido Luxury', text: 'Parques Xcaret (Pase Diario All-Fun)' }
    ],
    'Nickelodeon Hotels': [
      { val: 'Nickelodeon Riviera Maya', text: 'Nickelodeon Hotels & Resorts Riviera Maya' }
    ],
    'Riviera Maya': [
      { val: 'Cualquier Resort', text: 'Cualquier Resort Todo Incluido' },
      { val: 'Karisma Hotels', text: 'Hoteles Karisma (El Dorado, Generations)' },
      { val: 'Solo Todo Incluido Luxury', text: 'Resort Lujo Solo Adultos' }
    ],
    'Cancún': [
      { val: 'Cualquier Resort', text: 'Cualquier Resort Todo Incluido' },
      { val: 'Grand Fiesta Americana', text: 'Grand Fiesta Americana Coral Beach' },
      { val: 'Solo Todo Incluido Luxury', text: 'Resort Familiar Premium' }
    ]
  };

  const selectedOptions = options[formDest] || [
    { val: 'Cualquier Resort', text: 'Cualquier Resort Todo Incluido' }
  ];
  
  selectedOptions.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.val;
    el.textContent = opt.text;
    formHotel.appendChild(el);
  });
};

/* ========================================================================
   8. FORM SUBMISSION & WHATSAPP REDIRECT GENERATION
   ======================================================================== */
window.handleFormSubmit = function(event) {
  event.preventDefault();
  
  // Collect inputs
  const nombre = document.getElementById('formNombre').value;
  const destino = document.getElementById('formDestino').value;
  const hotel = document.getElementById('formHotel').value;
  const fecha = document.getElementById('formFecha').value;
  const pasajeros = document.getElementById('formPasajeros').value;
  const telefono = document.getElementById('formTelefono').value;
  const comentarios = document.getElementById('formComentarios').value;
  
  if (!nombre || !destino || !fecha || !pasajeros || !telefono) {
    alert('Por favor complete todos los campos requeridos (*).');
    return;
  }
  
  // Format dates nicely
  const dateFormatted = new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
  
  // Construct structured WhatsApp message for the agent
  const message = `Hola BG Caribe! Me gustaría solicitar una cotización formal.
Aquí están mis detalles:

*Nombre:* ${nombre}
*Destino:* ${destino}
*Hotel Preferido:* ${hotel}
*Fecha de Viaje:* ${dateFormatted}
*Número de Viajeros:* ${pasajeros}
*Teléfono:* ${telefono}
${comentarios ? `*Comentarios:* ${comentarios}` : ''}

Quedo atento a la propuesta. ¡Muchas gracias!`;

  // Encode URL
  const whatsappUrl = `https://wa.me/529989800625?text=${encodeURIComponent(message)}`;
  
  // Simulate database submission with a premium layout feedback
  const formBox = document.getElementById('quoteFormBox');
  formBox.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="width: 80px; height: 80px; background: rgba(37, 211, 102, 0.1); color: #25D366; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 2.5rem;">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <h3 style="font-family: var(--font-serif); font-size: 1.8rem; color: var(--color-primary); margin-bottom: 12px;">¡Cotización Registrada!</h3>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 30px; line-height: 1.6;">
        Tus datos se han guardado con éxito. Para agilizar la cotización y comunicarte directo con tu asesor certificado en este momento, haz clic en el botón de abajo.
      </p>
      <a href="${whatsappUrl}" target="_blank" class="btn btn-whatsapp" style="width: 100%;"><i class="fa-brands fa-whatsapp"></i> Abrir WhatsApp de Asesor</a>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 15px;">También puedes esperar a que te contactemos vía telefónica o correo en menos de 2 horas hábiles.</p>
    </div>
  `;
};

// Directly generates and opens WhatsApp from the current state of form fields
window.sendDirectWhatsApp = function() {
  const nombre = document.getElementById('formNombre').value || 'Invitado Web';
  const destino = document.getElementById('formDestino').value || 'No especificado';
  const hotel = document.getElementById('formHotel').value || 'No especificado';
  const fecha = document.getElementById('formFecha').value;
  const pasajeros = document.getElementById('formPasajeros').value;
  const comentarios = document.getElementById('formComentarios').value;
  
  let dateText = 'Fecha flexible';
  if (fecha) {
    dateText = new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }
  
  const message = `Hola! Vengo de su sitio web de BG Caribe y busco cotizar un paquete:
*Destino:* ${destino}
*Hotel de Preferencia:* ${hotel}
*Viajeros:* ${pasajeros}
*Fecha estimada:* ${dateText}
*Nombre:* ${nombre}
${comentarios ? `*Comentarios:* ${comentarios}` : ''}`;

  const whatsappUrl = `https://wa.me/529989800625?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

/* ========================================================================
   9. HERO SEARCH WIDGET LOGIC CONNECTION
   ======================================================================== */
function checkQuickWidgetParams() {
  const widget = document.getElementById('heroQuickWidget');
  if (!widget) return;
  
  widget.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Grab widget selections
    const widgetDest = document.getElementById('widgetDestino').value;
    const widgetDate = document.getElementById('widgetFecha').value;
    const widgetPass = document.getElementById('widgetPasajeros').value;
    const widgetHotel = document.getElementById('widgetHotel').value;
    
    // Set them in the formal form
    const formDest = document.getElementById('formDestino');
    const formFecha = document.getElementById('formFecha');
    const formPasajeros = document.getElementById('formPasajeros');
    const formHotel = document.getElementById('formHotel');
    
    if (formDest) {
      formDest.value = widgetDest;
      updateHotelPreferences();
    }
    if (formFecha) formFecha.value = widgetDate ? `${widgetDate}-01` : ''; // Normalize month value to standard date input
    if (formPasajeros) {
      if (widgetPass === '2 Adultos') formPasajeros.value = '2 Adultos';
      else if (widgetPass === '1 Adulto') formPasajeros.value = '1 Adulto';
      else if (widgetPass === 'Familia (2 Ad + 1 Niño)') formPasajeros.value = '2 Adultos + 1 Niño';
      else if (widgetPass === 'Familia (2 Ad + 2 Niños)') formPasajeros.value = '2 Adultos + 2 Niños';
      else formPasajeros.value = 'Otro (especificar en comentarios)';
    }
    if (formHotel && widgetHotel) {
      formHotel.value = widgetHotel;
    }
    
    // Scroll down to the form
    const targetSection = document.getElementById('cotizar');
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* ========================================================================
   10. TESTIMONIALS WALL MODAL & 50 REALISTIC REVIEWS DATA
   ======================================================================== */
const testimonialsDatabase = [
  {
    name: "Mariana Silva",
    location: "Ciudad de México",
    stars: 5,
    category: "xcaret",
    date: "Febrero 2026",
    text: "Reservamos el paquete de Hotel Xcaret Arte con BG Caribe y superó las expectativas. Todo fue transparente: los vuelos, la transportación oficial y el hotel. El precio de operador fue mucho menor que en portales tradicionales. ¡Recomendados al 100%!"
  },
  {
    name: "Alejandro Pineda",
    location: "Monterrey, NL",
    stars: 5,
    category: "nickelodeon",
    date: "Abril 2026",
    text: "La atención de los asesores es increíble. Diseñaron nuestro viaje familiar a Nickelodeon Riviera Maya. Los niños se divirtieron como locos en Aqua Nick y nosotros pudimos relajarnos gracias a la comida gourmet. El RNT registrado nos dio mucha confianza."
  },
  {
    name: "Dra. Lorena Treviño",
    location: "Guadalajara, Jal",
    stars: 5,
    category: "caribe",
    date: "Enero 2026",
    text: "Excelente atención antes y durante el viaje. Tuvimos un pequeño retraso de vuelo de regreso y el soporte telefónico 24/7 de BG Caribe nos guio para reagendar el traslado sin costo extra. Ese tipo de atención humana no se encuentra en las páginas baratas."
  },
  {
    name: "Carlos Guzzo",
    location: "Querétaro, Qro",
    stars: 5,
    category: "xcaret",
    date: "Marzo 2026",
    text: "Hospedarnos en Hotel Xcaret México con el paquete All-Fun Inclusive fue espectacular. Xplor y Xel-Há de forma ilimitada con niños pequeños fue comodísimo porque los autobuses oficiales salen cada 20 minutos desde el lobby. El proceso de pago a meses sin intereses con BG Caribe fue muy sencillo."
  },
  {
    name: "Familia Beltrán",
    location: "Chihuahua, Chih",
    stars: 5,
    category: "nickelodeon",
    date: "Mayo 2026",
    text: "Reservamos la suite con acceso a alberca (swim-up) en Nickelodeon y fue un acierto total. Aqua Nick está increíble, los toboganes son de nivel mundial. Los asesores de la agencia nos apoyaron para planificar los horarios de fotos con Bob Esponja y Patricio. Atención de 10."
  },
  {
    name: "Sofía y Jorge",
    location: "Mérida, Yuc",
    stars: 5,
    category: "caribe",
    date: "Mayo 2026",
    text: "Buscábamos una luna de miel relajada pero lujosa en la Riviera Maya. En BG Caribe nos recomendaron Secrets Akumal. La playa con tortugas es de ensueño y las amenidades de luna de miel cortesía de la agencia hicieron la estancia aún más especial."
  },
  {
    name: "Ing. Mauricio Ortiz",
    location: "San Luis Potosí, SLP",
    stars: 5,
    category: "xcaret",
    date: "Febrero 2026",
    text: "Estuvimos en la Casa de la Música en Xcaret Arte. El concepto de talleres artísticos incluidos (tomé el de alfarería) es genial. La comida del buffet Mercado de San Juan y las cenas de especialidades son espectaculares. El soporte de la agencia BG Caribe fue impecable desde el primer día."
  },
  {
    name: "Gabriela y Fernando",
    location: "Puebla, Pue",
    stars: 4,
    category: "caribe",
    date: "Marzo 2026",
    text: "Hicimos un viaje grupal familiar al Hard Rock Riviera Maya. Todo muy bien organizado. Los traslados privados que venían en el paquete de BG Caribe llegaron súper puntuales y con camionetas nuevas. La atención telefónica siempre amable."
  },
  {
    name: "Andrea Ledesma",
    location: "León, Gto",
    stars: 5,
    category: "xcaret",
    date: "Abril 2026",
    text: "Viajé con mis amigas a Xcaret Arte. La pasamos increíble en el rooftop de Casa del Diseño. El poder ir a Xoximilco de noche y tener la transportación incluida sin preocuparnos por manejar nos permitió disfrutar al máximo. ¡Excelente asesoría!"
  },
  {
    name: "Familia González Vega",
    location: "Toluca, EdoMex",
    stars: 5,
    category: "nickelodeon",
    date: "Mayo 2026",
    text: "Mis hijos de 6 y 9 años son fanáticos de las Tortugas Ninja y amaron el hotel. El parque acuático Aqua Nick es enorme y muy seguro. El servicio de buffet y snacks es constante y de buena calidad. Gracias a BG Caribe por ayudarnos a conseguir tarifa preferencial."
  },
  {
    name: "Dr. Ricardo Ruiz",
    location: "Saltillo, Coah",
    stars: 5,
    category: "caribe",
    date: "Marzo 2026",
    text: "Muy profesionales. Contratamos un paquete completo con vuelos incluidos para Cancún. La documentación de viaje llegó completa y a tiempo, con instrucciones claras para el punto de encuentro con el transportista en el aeropuerto. Cero sorpresas desagradables."
  },
  {
    name: "Claudia Herrera",
    location: "Aguascalientes, Ags",
    stars: 5,
    category: "xcaret",
    date: "Diciembre 2025",
    text: "El restaurante de autor Ha' del Chef Carlos Gaytán en Xcaret México fue una experiencia culinaria maravillosa. Vale totalmente la pena reservar con anticipación a través de la agencia. Las caletas naturales del hotel son perfectas para hacer snorkel."
  },
  {
    name: "Lucía Fernández",
    location: "Hermosillo, Son",
    stars: 5,
    category: "caribe",
    date: "Enero 2026",
    text: "Excelente servicio de atención al cliente. Mi esposo y yo queríamos un hotel Solo Adultos con buena playa. Nos recomendaron Secrets Maroma Beach y fue un paraíso. La arena parece talco y el servicio de concierge es fantástico. Todo coordinado perfecto por la agencia."
  },
  {
    name: "Miguel y Diana",
    location: "Cuernavaca, Mor",
    stars: 5,
    category: "xcaret",
    date: "Abril 2026",
    text: "Nos hospedamos en La Casa de la Playa (concepto ultra-luxury de Xcaret). Un hotel íntimo con servicio de mayordomo. Tuvimos acceso exclusivo al callejón de chocolate y una cena degustación privada. BG Caribe gestionó todas nuestras solicitudes especiales a la perfección."
  },
  {
    name: "Familia Ortega",
    location: "Torreón, Coah",
    stars: 5,
    category: "nickelodeon",
    date: "Febrero 2026",
    text: "Las suites familiares de Nickelodeon son espectaculares, súper espaciosas y con dos baños completos, ideal para viajar con adolescentes. El parque Aqua Nick nos encantó a todos, en especial el baño de Slime masivo. Recomiendo reservar con BG Caribe, son expertos en el resort."
  },
  {
    name: "Patricia Solís",
    location: "Durango, Dgo",
    stars: 4,
    category: "caribe",
    date: "Enero 2026",
    text: "El hotel Hyatt Zilara Cancún es hermoso y muy tranquilo. Tuvimos una habitación con vista al mar espectacular. El proceso de reservación con BG Caribe fue muy rápido y nos dieron excelentes facilidades de pago."
  },
  {
    name: "Javier y Carolina",
    location: "Tampico, Tamps",
    stars: 5,
    category: "xcaret",
    date: "Febrero 2026",
    text: "El All-Fun inclusive de Xcaret es inigualable. Fuimos a Xenses y Xavage en el mismo viaje. El servicio en el hotel es cálido y la arquitectura eco-integradora te hace sentir inmerso en la selva. La agencia BG Caribe resolvió todas nuestras dudas con rapidez y amabilidad."
  },
  {
    name: "Dra. Mónica Castro",
    location: "Tuxtla Gutiérrez, Chis",
    stars: 5,
    category: "caribe",
    date: "Abril 2026",
    text: "Comparé tarifas en Expedia y PriceTravel, y el paquete mayorista que me cotizó BG Caribe para el Atelier Playa Mujeres fue significativamente más barato, incluyendo traslados privados. Además, el trato personalizado de la asesora Claudia fue excelente."
  },
  {
    name: "Familia Castillo",
    location: "Villahermosa, Tab",
    stars: 5,
    category: "nickelodeon",
    date: "Abril 2026",
    text: "El desayuno interactivo con Bob Esponja en Nickelodeon fue el punto fuerte de las vacaciones de mis hijos. La comida gourmet inclusive es de primer nivel, nada que ver con los bufés típicos. Agradecemos a BG Caribe por la excelente recomendación del resort."
  },
  {
    name: "Estela Rincón",
    location: "Colima, Col",
    stars: 5,
    category: "xcaret",
    date: "Enero 2026",
    text: "El Muluk Spa en cavernas naturales en Hotel Xcaret México es una maravilla. El circuito de hidroterapia es súper relajante. Todo el viaje estuvo perfectamente coordinado por BG Caribe, desde el traslado oficial de Xcaret (Xuttle) hasta la estancia."
  },
  {
    name: "Laura Pozos",
    location: "Campeche, Camp",
    stars: 5,
    category: "caribe",
    date: "Mayo 2026",
    text: "Viajé con mi madre a Cancún y nos hospedamos en el TRS Coral. Un hotel tranquilo, moderno y con una comida de especialidad exquisita. Los traslados privados incluidos por BG Caribe llegaron a tiempo con choferes muy educados."
  },
  {
    name: "Familia Méndez Rojas",
    location: "Zacatecas, Zac",
    stars: 5,
    category: "nickelodeon",
    date: "Febrero 2026",
    text: "Excelente soporte por parte del asesor Alejandro. Nos recomendó la habitación Liko Swim-Up Suite y fue increíble tener la alberca a unos pasos de la cama. Aqua Nick divertidísimo y el servicio gourmet excelente. Un viaje familiar inolvidable."
  },
  {
    name: "Fernando Trejo",
    location: "Tepic, Nay",
    stars: 5,
    category: "xcaret",
    date: "Diciembre 2025",
    text: "Xoximilco de noche en el All-Fun inclusive de Xcaret es de lo más divertido, con música en vivo y barra libre de tequila. Recomiendo totalmente contratar los paquetes completos de BG Caribe porque te desentiendes de comprar entradas por separado y te ahorras dinero."
  },
  {
    name: "Valeria Naranjo",
    location: "Cancún, QRoo",
    stars: 4,
    category: "caribe",
    date: "Abril 2026",
    text: "Vivo en Cancún y compré un paquete de fin de semana para el hotel Dreams Jade a través de BG Caribe para festejar mi aniversario. La tarifa local que me consiguieron fue excelente y el servicio de reservaciones muy ágil y amable."
  },
  {
    name: "Carmen Gaxiola",
    location: "La Paz, BCS",
    stars: 5,
    category: "xcaret",
    date: "Noviembre 2025",
    text: "La vista desde el rooftop de Casa de los Artistas en Xcaret Arte es insuperable. El servicio de mayordomía te resuelve cualquier reservación de cena o tour al instante. BG Caribe hizo un excelente trabajo coordinando todos los detalles de nuestra estancia."
  },
  {
    name: "Familia Soto",
    location: "Mexicali, BC",
    stars: 5,
    category: "nickelodeon",
    date: "Enero 2026",
    text: "Aqua Nick tiene toboganes increíbles para todas las edades. Las suites temáticas de Nickelodeon son de lo más divertidas y cómodas. Pagamos nuestra reservación a meses sin intereses con BG Caribe. Todo seguro y oficial con su registro RNT."
  },
  {
    name: "Héctor Duarte",
    location: "Mazatlán, Sin",
    stars: 5,
    category: "caribe",
    date: "Marzo 2026",
    text: "Atención personalizada impecable. Queríamos un viaje a Cancún que combinara descanso y actividades. Nos recomendaron el hotel Occidental Tucancún con tours opcionales. El paquete de BG Caribe fue el más competitivo en precio."
  },
  {
    name: "Dra. Sandra Ramos",
    location: "Tapachula, Chis",
    stars: 5,
    category: "xcaret",
    date: "Mayo 2026",
    text: "El restaurante de alta cocina mexicana Ha' es una joya imperdible en Xcaret. Recomiendo ampliamente a la agencia BG Caribe; nos guiaron en cada paso para asegurar las cenas en los restaurantes más exclusivos que se llenan rápido."
  },
  {
    name: "Eduardo y Liz",
    location: "Xalapa, Ver",
    stars: 5,
    category: "caribe",
    date: "Abril 2026",
    text: "Nuestra luna de miel en el hotel Unico 20°87° en Riviera Maya fue un sueño. La decoración de la habitación, las albercas y el servicio de spa de primera. Excelente recomendación y gestión de BG Caribe."
  },
  {
    name: "Familia Cárdenas",
    location: "Culiacán, Sin",
    stars: 5,
    category: "nickelodeon",
    date: "Mayo 2026",
    text: "Aqua Nick es el mejor parque acuático infantil de la Riviera Maya. Las suites son súper modernas y limpias. Pagamos de forma segura con transferencia bancaria directa a BG Transportadora del Caribe. Garantía de confianza."
  },
  {
    name: "Gloria y Pedro",
    location: "Chetumal, QRoo",
    stars: 5,
    category: "xcaret",
    date: "Marzo 2026",
    text: "El tour oficial de Xcaret a Chichén Itzá (Xichén Deluxe) es de lo mejor, con guía certificado y desayuno premium a bordo del autobús. BG Caribe integró este tour a nuestro paquete de forma impecable. Un servicio excelente."
  },
  {
    name: "Liliana Mendoza",
    location: "Nogales, Son",
    stars: 5,
    category: "caribe",
    date: "Febrero 2026",
    text: "Reservar con una agencia mayorista con RNT oficial te da la paz mental de que tu dinero está protegido. Todo el proceso de cotización y reservación con BG Caribe fue claro y transparente. Muy contenta con el servicio."
  },
  {
    name: "Gustavo Loya",
    location: "Celaya, Gto",
    stars: 5,
    category: "nickelodeon",
    date: "Marzo 2026",
    text: "El servicio Gourmet Inclusive de Nickelodeon es sobresaliente: cortes de carne, pasta fresca y coctelería premium sin límites. El parque acuático es sensacional. Agradecemos a BG Caribe por armarnos el paquete perfecto."
  },
  {
    name: "Familia Ibarra",
    location: "Ciudad Juárez, Chih",
    stars: 5,
    category: "xcaret",
    date: "Enero 2026",
    text: "Nuestros hijos amaron Xenses en el todo incluido de Xcaret. Es un parque sensorial muy divertido y único. El Hotel Xcaret México es espectacular y la atención de la agencia BG Caribe fue excelente de principio a fin."
  },
  {
    name: "Rafael y Verónica",
    location: "Acapulco, Gro",
    stars: 5,
    category: "caribe",
    date: "Noviembre 2025",
    text: "El hotel Atelier Playa Mujeres de ensueño. Una arquitectura moderna, albercas enormes y playa tranquila. BG Caribe nos recomendó este hotel para nuestro aniversario y fue un acierto absoluto. Excelente servicio."
  },
  {
    name: "Familia Rosas",
    location: "Coatzacoalcos, Ver",
    stars: 5,
    category: "nickelodeon",
    date: "Abril 2026",
    text: "Aqua Nick tiene atracciones acuáticas geniales y el río lento es súper relajante. Las habitaciones de Nickelodeon son muy coloridas y cómodas para los niños. Agradecemos a la agencia BG Caribe por el excelente trato."
  },
  {
    name: "Beatriz Escalante",
    location: "Minatitlán, Ver",
    stars: 5,
    category: "xcaret",
    date: "Febrero 2026",
    text: "El concepto eco-sustentable de Xcaret es fascinante, con materiales naturales e integración con la selva. La comida en el restaurante Mercado de San Juan es deliciosa. BG Caribe nos asesoró de forma excelente."
  },
  {
    name: "Isabel y Luis",
    location: "Piedras Negras, Coah",
    stars: 5,
    category: "caribe",
    date: "Mayo 2026",
    text: "Teníamos dudas por fraudes de internet, pero al verificar el RNT oficial (0423005C28259) en el portal de Sectur nos dio total tranquilidad. La atención del equipo de BG Caribe fue súper transparente y humana. Los recomendamos ampliamente."
  },
  {
    name: "Familia Vargas",
    location: "Orizaba, Ver",
    stars: 5,
    category: "xcaret",
    date: "Abril 2026",
    text: "Xplor Fuego de noche es una aventura de adrenalina con antorchas, tirolesas y ríos de lava. Xcaret es sin duda el mejor concepto vacacional de México. Gracias a BG Caribe por conseguirnos las mejores tarifas mayoristas."
  },
  {
    name: "Silvia Tovar",
    location: "Matamoros, Tamps",
    stars: 5,
    category: "nickelodeon",
    date: "Febrero 2026",
    text: "Las fotos familiares con Patricio Estrella y Bob Esponja fueron el mejor recuerdo para mis hijas. El hotel es súper divertido y Aqua Nick es fenomenal. BG Caribe gestionó nuestra reserva de forma segura y eficiente."
  },
  {
    name: "Francisco Salcido",
    location: "Navojoa, Son",
    stars: 4,
    category: "caribe",
    date: "Marzo 2026",
    text: "Todo excelente en el hotel Riu Palace Las Américas en Cancún. La comida buffet y de especialidades muy rica. Gran atención por parte de la agencia BG Caribe."
  },
  {
    name: "Elena y Andrés",
    location: "San Cristóbal, Chis",
    stars: 5,
    category: "xcaret",
    date: "Mayo 2026",
    text: "Hospedarse en Xcaret Arte te da una paz increíble. Las caletas para hacer kayak y paddle board son espectaculares. El trato de BG Caribe fue de primera, siempre atentos a resolver nuestras dudas antes de viajar."
  }
];

function initTestimonialsModal() {
  const modal = document.getElementById('testimonialsModal');
  const btnOpen = document.getElementById('btnVerMasTestimonios');
  const btnClose = document.getElementById('closeTestimonialsModal');
  const grid = document.getElementById('modalTestimonialsGrid');
  const filterTabs = document.querySelectorAll('.testimonials-modal-filters .filter-tab');

  if (!modal || !btnOpen || !btnClose || !grid) return;

  // Open Modal
  btnOpen.addEventListener('click', () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock background scroll
    renderModalTestimonials('todos');
  });

  // Close Modal
  const closeModalFunc = () => {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Unlock background scroll
  };

  btnClose.addEventListener('click', closeModalFunc);

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModalFunc();
    }
  });

  // Filter Tabs Event Listeners
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-filter');
      renderModalTestimonials(filter);
    });
  });

  // Render function for reviews
  function renderModalTestimonials(filter) {
    grid.innerHTML = '';
    
    const filteredData = filter === 'todos' 
      ? testimonialsDatabase 
      : testimonialsDatabase.filter(item => item.category === filter);

    filteredData.forEach(item => {
      const card = document.createElement('div');
      card.classList.add('modal-card');
      
      // Star elements
      let starsHTML = '';
      for (let i = 0; i < 5; i++) {
        starsHTML += i < item.stars 
          ? '<i class="fa-solid fa-star"></i>' 
          : '<i class="fa-regular fa-star"></i>';
      }

      // Initial letter of author name
      const initial = item.name.charAt(0);

      card.innerHTML = `
        <div class="modal-card-stars">${starsHTML}</div>
        <p class="modal-card-text">"${item.text}"</p>
        <div class="modal-card-author">
          <div class="modal-author-img">${initial}</div>
          <div class="modal-author-info">
            <h5>${item.name}</h5>
            <p>${item.location} | Viajó en ${item.date}</p>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }
}

