/**
 * Options page for Viewport Word Counter
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Niblie Settings Page Loaded');
  
  // Tab switching functionality
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');
  
  console.log('Found', tabLinks.length, 'tab links');
  console.log('Found', tabContents.length, 'tab contents');
  
  tabLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Tab clicked:', this.getAttribute('data-tab'));
      
      // Remove active class from all links
      tabLinks.forEach(function(l) {
        l.classList.remove('active');
      });
      
      // Remove active class from all content sections
      tabContents.forEach(function(c) {
        c.classList.remove('active');
      });
      
      // Add active to clicked link
      this.classList.add('active');
      
      // Show corresponding content
      const tabId = this.getAttribute('data-tab');
      const targetContent = document.getElementById(tabId);
      
      if (targetContent) {
        targetContent.classList.add('active');
        console.log('Activated tab:', tabId);
      } else {
        console.error('Tab content not found:', tabId);
      }
    });
  });

  // Color style tabs (Solid/Gradient)
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const parent = this.closest('.card');
      parent.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      this.classList.add('active');
      
      const tab = this.getAttribute('data-tab');
      const solidOptions = parent.querySelector('#solid-options');
      const gradientOptions = parent.querySelector('#gradient-options');
      
      if (tab === 'solid') {
        if (solidOptions) solidOptions.style.display = 'block';
        if (gradientOptions) gradientOptions.style.display = 'none';
      } else {
        if (solidOptions) solidOptions.style.display = 'none';
        if (gradientOptions) gradientOptions.style.display = 'block';
      }
    });
  });

  // Color value updates
  document.querySelectorAll('input[type="color"]').forEach(function(input) {
    input.addEventListener('input', function() {
      const valueSpan = this.nextElementSibling;
      if (valueSpan && valueSpan.classList.contains('color-value')) {
        valueSpan.textContent = this.value.toUpperCase();
      }
    });
  });

  // Range value updates
  document.querySelectorAll('input[type="range"]').forEach(function(input) {
    input.addEventListener('input', function() {
      const valueSpan = this.parentElement.querySelector('.range-value');
      if (valueSpan) {
        if (this.id === 'gradient-angle') {
          valueSpan.textContent = this.value + '°';
        } else {
          valueSpan.textContent = this.value + '%';
        }
      }
    });
  });
});

// Default settings
const autofillList = document.getElementById("autofill-list");
const addFieldBtn = document.getElementById("add-autofill-field");

let currentAutofillFields = [];

function renderAutofillFields(fields = []) {
  currentAutofillFields = fields;
  autofillList.innerHTML = "";

  fields.forEach((pair, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "autofill-item";

    const keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.placeholder = "Field name (e.g., Name, Email)";
    keyInput.value = pair.key;

    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.placeholder = "Value (e.g., Shashikant)";
    valueInput.value = pair.value;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove-btn";
    removeBtn.onclick = () => {
      currentAutofillFields.splice(index, 1);
      renderAutofillFields(currentAutofillFields);
      chrome.storage.sync.set({ autofillFields: currentAutofillFields });
    };

    keyInput.oninput = () => {
      currentAutofillFields[index].key = keyInput.value;
      chrome.storage.sync.set({ autofillFields: currentAutofillFields });
    };
    
    valueInput.oninput = () => {
      currentAutofillFields[index].value = valueInput.value;
      chrome.storage.sync.set({ autofillFields: currentAutofillFields });
    };

    wrapper.appendChild(keyInput);
    wrapper.appendChild(valueInput);
    wrapper.appendChild(removeBtn);
    autofillList.appendChild(wrapper);
  });
}

addFieldBtn.addEventListener('click', () => {
  // Add a new empty field to the current array
  currentAutofillFields.push({ key: '', value: '' });

  // Re-render and save to storage
  renderAutofillFields(currentAutofillFields);
  chrome.storage.sync.set({ autofillFields: currentAutofillFields });
});


document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get("autofillFields", (data) => {
    renderAutofillFields(data.autofillFields || []);
  });
});

const DEFAULT_SETTINGS = {
  position: "top-right",
  showWordCount: true,
  colorStyle: "solid",
  badgeColor: "#4285f4",
  textColor: "#ffffff",
  gradientStart: "#4285f4",
  gradientEnd: "#0F9D58",
  gradientAngle: 45,
  opacity: 90,
  useCuteTheme: false,
  cuteThemeStyle: "kawaii",
  enableAnimations: false,
  enableFloatingParticles: true,
  particleType: 'hearts',
  particleFrequency: 3,
  particleSpeed: 3,
  customParticleImage: null,
  customParticleType: 'png',
  gifAnimationDelay: 100
};

// DOM Elements
const positionButtons = document.querySelectorAll(".position-btn");
const showWordCount = document.getElementById("show-word-count");
const styleTabs = document.querySelectorAll(".tab-btn");
const solidOptions = document.getElementById("solid-options");
const gradientOptions = document.getElementById("gradient-options");
const badgeColorInput = document.getElementById("badge-color");
const textColorInput = document.getElementById("text-color");
const gradientStartInput = document.getElementById("gradient-start");
const gradientEndInput = document.getElementById("gradient-end");
const gradientAngleInput = document.getElementById("gradient-angle");
const badgeOpacityInput = document.getElementById("opacity-slider");
const saveButton = document.getElementById("save-btn");
const statusMessage = document.getElementById("status-message");
const badgePreview = document.querySelector(".badge-preview");

// New theme controls
const useCuteThemeCheckbox = document.getElementById("use-cute-theme");
const cuteThemeOptions = document.getElementById("cute-theme-options");
const cuteThemeStyleRadios = document.getElementsByName("cute-theme-style");
const enableAnimationsCheckbox = document.getElementById("enable-animations");

// Floating particles controls
const enableFloatingParticlesCheckbox = document.getElementById("enable-floating-particles");
const floatingParticlesOptions = document.getElementById("floating-particles-options");
const particleTypeRadios = document.getElementsByName("particle-type");
const customParticleUpload = document.getElementById("custom-particle-upload");
const customParticleFile = document.getElementById("custom-particle-file");
const customParticlePreview = document.getElementById("custom-particle-preview");
const customParticlePreviewImg = document.getElementById("custom-particle-preview-img");
const removeCustomParticleBtn = document.getElementById("remove-custom-particle");
const gifAnimationSettings = document.getElementById("gif-animation-settings");
const gifAnimationDelay = document.getElementById("gif-animation-delay");
const gifDelayValue = document.getElementById("gif-delay-value");
const particleFrequencyInput = document.getElementById("particle-frequency");
const frequencyValueSpan = document.getElementById("frequency-value");
const particleSpeedInput = document.getElementById("particle-speed");
const speedValueSpan = document.getElementById("speed-value");

let customParticleImageData = null;
let customParticleType = 'png';

console.log('[Options] Particle image elements loaded:', {
  file: !!customParticleFile,
  preview: !!customParticlePreview,
  previewImg: !!customParticlePreviewImg
});

// Helper functions
const updateColorValue = (input, valueDisplay) => {
  valueDisplay.textContent = input.value.toUpperCase();
};

const updateRangeValue = (input, valueDisplay, unit = "") => {
  valueDisplay.textContent = `${input.value}${unit}`;
};

// Floating particles event listeners
if (enableFloatingParticlesCheckbox) {
  enableFloatingParticlesCheckbox.addEventListener('change', function() {
    if (floatingParticlesOptions) {
      floatingParticlesOptions.style.display = this.checked ? 'block' : 'none';
    }
  });
}

// Particle type radio buttons
particleTypeRadios.forEach(radio => {
  radio.addEventListener('change', function() {
    if (customParticleUpload) {
      customParticleUpload.style.display = this.value === 'custom' ? 'block' : 'none';
    }
  });
});

// Custom particle file upload
if (customParticleFile) {
  customParticleFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (max 100KB)
    if (file.size > 100 * 1024) {
      alert('File size must be less than 100KB. Please choose a smaller image.');
      this.value = '';
      return;
    }
    
    // Validate file type
    if (!file.type.match('image/(png|gif)')) {
      alert('Please upload a PNG or GIF file.');
      this.value = '';
      return;
    }
    
    customParticleType = file.type === 'image/gif' ? 'gif' : 'png';
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = function(event) {
      customParticleImageData = event.target.result;
      console.log('[Options] Custom particle image loaded:', {
        type: customParticleType,
        size: customParticleImageData.length,
        preview: customParticleImageData.substring(0, 50) + '...'
      });
      
      // Show preview
      if (customParticlePreviewImg) {
        customParticlePreviewImg.src = customParticleImageData;
      }
      if (customParticlePreview) {
        customParticlePreview.style.display = 'block';
      }
      
      // Show GIF settings if it's a GIF
      if (gifAnimationSettings) {
        gifAnimationSettings.style.display = customParticleType === 'gif' ? 'block' : 'none';
      }
    };
    reader.readAsDataURL(file);
  });
}

// Remove custom particle image
if (removeCustomParticleBtn) {
  removeCustomParticleBtn.addEventListener('click', function() {
    customParticleImageData = null;
    if (customParticleFile) customParticleFile.value = '';
    if (customParticlePreview) customParticlePreview.style.display = 'none';
    if (gifAnimationSettings) gifAnimationSettings.style.display = 'none';
  });
}

// GIF animation delay slider
if (gifAnimationDelay) {
  gifAnimationDelay.addEventListener('input', function() {
    if (gifDelayValue) {
      gifDelayValue.textContent = this.value + 'ms';
    }
  });
}

// Particle frequency slider
if (particleFrequencyInput) {
  particleFrequencyInput.addEventListener('input', function() {
    if (frequencyValueSpan) {
      frequencyValueSpan.textContent = this.value;
    }
  });
}

// Particle speed slider
if (particleSpeedInput) {
  particleSpeedInput.addEventListener('input', function() {
    if (speedValueSpan) {
      speedValueSpan.textContent = this.value;
    }
  });
}

const updateBadgePreview = () => {
  // Get current values
  const isShowingWordCount = showWordCount.checked;
  const opacity = badgeOpacityInput.value / 100;
  let bgColor;

  // Get the current color style tab
  const colorTab = document.querySelector(".tab-btn.active").dataset.tab;

  if (colorTab === "solid") {
    bgColor = badgeColorInput.value;
  } else {
    const start = gradientStartInput.value;
    const end = gradientEndInput.value;
    const angle = gradientAngleInput.value;
    bgColor = `linear-gradient(${angle}deg, ${start}, ${end})`;
  }

  // Update preview
  badgePreview.style.background = bgColor;
  badgePreview.style.color = textColorInput.value;
  badgePreview.style.opacity = opacity;
  badgePreview.textContent = isShowingWordCount ? "123 words" : "";

  // Cute theme handling
  const useCuteTheme = useCuteThemeCheckbox.checked;
  let cuteThemeStyle = "kawaii";
  for (const radio of cuteThemeStyleRadios) {
    if (radio.checked) {
      cuteThemeStyle = radio.value;
      break;
    }
  }

  badgePreview.className = "badge-preview";
  badgePreview.style.fontFamily = "";
  badgePreview.style.border = "";

  if (isShowingWordCount) {
    if (useCuteTheme) {
      // Apply cute theme styling to preview
      badgePreview.classList.add(cuteThemeStyle);

      // Define emojis for each theme
      const emojis = {
        kawaii: "📝",
        pastel: "✏️",
        bubbly: "📚",
      };

      badgePreview.innerHTML = `<span style="font-size: 16px; margin-right: 5px;">${emojis[cuteThemeStyle]}</span><span>123 words</span>`;
      badgePreview.style.display = "flex";
      badgePreview.style.alignItems = "center";
      badgePreview.style.borderRadius = "18px";
      badgePreview.style.padding = "8px 15px";
    } else {
      // Regular styling
      if (colorTab === "solid") {
        badgePreview.style.backgroundColor = badgeColorInput.value;
      } else {
        const angle = gradientAngleInput.value;
        badgePreview.style.background = `linear-gradient(${angle}deg, ${gradientStartInput.value}, ${gradientEndInput.value})`;
      }

      badgePreview.style.color = textColorInput.value;
      badgePreview.textContent = "123 words";
    }
  } else {
    // Show icon-only badge
    if (useCuteTheme) {
      badgePreview.classList.add(cuteThemeStyle);

      const emojis = {
        kawaii: "📝",
        pastel: "✏️",
        bubbly: "📚",
      };

      badgePreview.innerHTML = `<span style="font-size: 16px;">${emojis[cuteThemeStyle]}</span>`;
      badgePreview.style.width = "40px";
      badgePreview.style.height = "40px";
      badgePreview.style.borderRadius = "50%";
      badgePreview.style.padding = "0";
      badgePreview.style.display = "flex";
      badgePreview.style.alignItems = "center";
      badgePreview.style.justifyContent = "center";
    } else {
      badgePreview.textContent = "📊";
      badgePreview.style.width = "32px";
      badgePreview.style.height = "32px";
      badgePreview.style.borderRadius = "50%";
      badgePreview.style.display = "flex";
      badgePreview.style.alignItems = "center";
      badgePreview.style.justifyContent = "center";
      badgePreview.style.padding = "0";

      if (colorTab === "solid") {
        badgePreview.style.backgroundColor = badgeColorInput.value;
      } else {
        const angle = gradientAngleInput.value;
        badgePreview.style.background = `linear-gradient(${angle}deg, ${gradientStartInput.value}, ${gradientEndInput.value})`;
      }

      badgePreview.style.color = textColorInput.value;
    }
  }

  // Apply opacity
  badgePreview.style.opacity = badgeOpacityInput.value / 100;
};

// Position button handling
positionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    positionButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    updateBadgePreview();
  });
});

// Show/hide word count toggle
showWordCount.addEventListener("change", updateBadgePreview);

// Style tabs handling
styleTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    styleTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    if (tab.dataset.tab === "solid") {
      solidOptions.style.display = "flex";
      gradientOptions.style.display = "none";
    } else {
      solidOptions.style.display = "none";
      gradientOptions.style.display = "flex";
    }

    updateBadgePreview();
  });
});

// Color input handling
document.querySelectorAll('input[type="color"]').forEach((input) => {
  const valueDisplay = input.parentElement.querySelector(".color-value");
  input.addEventListener("input", () => {
    updateColorValue(input, valueDisplay);
    updateBadgePreview();
  });
});

// Range input handling
gradientAngleInput.addEventListener("input", () => {
  updateRangeValue(
    gradientAngleInput,
    gradientAngleInput.nextElementSibling,
    "°"
  );
  updateBadgePreview();
});

badgeOpacityInput.addEventListener("input", () => {
  updateRangeValue(
    badgeOpacityInput,
    badgeOpacityInput.nextElementSibling,
    "%"
  );
  updateBadgePreview();
});

// Cute theme toggle visibility logic
useCuteThemeCheckbox.addEventListener("change", function () {
  cuteThemeOptions.style.display = this.checked ? "block" : "none";
  updateBadgePreview();
});

// Update preview when theme style changes
cuteThemeStyleRadios.forEach((radio) => {
  radio.addEventListener("change", updateBadgePreview);
});

// Enable animations toggle
enableAnimationsCheckbox.addEventListener("change", updateBadgePreview);

// Save settings
saveButton.addEventListener("click", () => {
  // Get advanced feature checkboxes
  const performanceMonitorCheckbox = document.getElementById('enable-performance-monitor');
  const errorTrackingCheckbox = document.getElementById('enable-error-tracking');
  const analyticsCheckbox = document.getElementById('enable-analytics');
  const debugModeCheckbox = document.getElementById('enable-debug-mode');
  
  // Get current settings
  const settings = {
    position: document.querySelector(".position-btn.active").dataset.position,
    showWordCount: showWordCount.checked,
    colorStyle: document.querySelector(".tab-btn.active").dataset.tab,
    badgeColor: badgeColorInput.value,
    textColor: textColorInput.value,
    gradientStart: gradientStartInput.value,
    gradientEnd: gradientEndInput.value,
    gradientAngle: parseInt(gradientAngleInput.value),
    opacity: parseInt(badgeOpacityInput.value),
    useCuteTheme: useCuteThemeCheckbox.checked,
    cuteThemeStyle: Array.from(cuteThemeStyleRadios).find(
      (radio) => radio.checked
    ).value,
    enableAnimations: enableAnimationsCheckbox.checked,
    // Floating particles settings
    enableFloatingParticles: enableFloatingParticlesCheckbox ? enableFloatingParticlesCheckbox.checked : true,
    particleType: Array.from(particleTypeRadios).find((radio) => radio.checked)?.value || 'hearts',
    particleFrequency: particleFrequencyInput ? parseInt(particleFrequencyInput.value) : 3,
    particleSpeed: particleSpeedInput ? parseInt(particleSpeedInput.value) : 3,
    customParticleImage: customParticleImageData || null,
    customParticleType: customParticleType || 'png',
    gifAnimationDelay: gifAnimationDelay ? parseInt(gifAnimationDelay.value) : 100,
    // Advanced features
    enablePerformanceMonitor: performanceMonitorCheckbox ? performanceMonitorCheckbox.checked : false,
    enableErrorTracking: errorTrackingCheckbox ? errorTrackingCheckbox.checked : true,
    enableAnalytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
    enableDebugMode: debugModeCheckbox ? debugModeCheckbox.checked : false
  };

  // Log particle image status before saving
  console.log('[Options] Saving settings with particle image:', {
    hasImage: !!settings.customParticleImage,
    imageType: settings.customParticleType,
    imageSize: settings.customParticleImage ? settings.customParticleImage.length : 0
  });

  // Save to storage
  chrome.storage.sync.set({ settings }, () => {
    console.log('[Options] Settings saved successfully');
    statusMessage.textContent = "Settings saved!";
    statusMessage.style.color = "var(--success)";
    setTimeout(() => {
      statusMessage.textContent = "";
    }, 3000);
  });
});

// Load saved settings
const loadSettings = () => {
  chrome.storage.sync.get("settings", (data) => {
    const settings = data.settings || DEFAULT_SETTINGS;

    // Apply settings to UI
    document
      .querySelector(`.position-btn[data-position="${settings.position}"]`)
      .classList.add("active");
    showWordCount.checked = settings.showWordCount;
    
    // Load advanced feature settings
    const performanceMonitorCheckbox = document.getElementById('enable-performance-monitor');
    const errorTrackingCheckbox = document.getElementById('enable-error-tracking');
    const analyticsCheckbox = document.getElementById('enable-analytics');
    const debugModeCheckbox = document.getElementById('enable-debug-mode');
    
    if (performanceMonitorCheckbox) {
      performanceMonitorCheckbox.checked = settings.enablePerformanceMonitor !== false;
    }
    if (errorTrackingCheckbox) {
      errorTrackingCheckbox.checked = settings.enableErrorTracking !== false;
    }
    if (analyticsCheckbox) {
      analyticsCheckbox.checked = settings.enableAnalytics || false;
    }
    if (debugModeCheckbox) {
      debugModeCheckbox.checked = settings.enableDebugMode || false;
    }

    if (settings.colorStyle === "gradient") {
      document.querySelector('.tab-btn[data-tab="gradient"]').click();
    }

    badgeColorInput.value = settings.badgeColor;
    updateColorValue(
      badgeColorInput,
      badgeColorInput.parentElement.querySelector(".color-value")
    );

    textColorInput.value = settings.textColor;
    updateColorValue(
      textColorInput,
      textColorInput.parentElement.querySelector(".color-value")
    );

    gradientStartInput.value = settings.gradientStart;
    updateColorValue(
      gradientStartInput,
      gradientStartInput.parentElement.querySelector(".color-value")
    );

    gradientEndInput.value = settings.gradientEnd;
    updateColorValue(
      gradientEndInput,
      gradientEndInput.parentElement.querySelector(".color-value")
    );

    gradientAngleInput.value = settings.gradientAngle;
    updateRangeValue(
      gradientAngleInput,
      gradientAngleInput.nextElementSibling,
      "°"
    );

    badgeOpacityInput.value = settings.opacity;
    updateRangeValue(
      badgeOpacityInput,
      badgeOpacityInput.nextElementSibling,
      "%"
    );

    // Cute theme settings
    useCuteThemeCheckbox.checked = settings.useCuteTheme !== false;
    cuteThemeOptions.style.display = useCuteThemeCheckbox.checked
      ? "block"
      : "none";

    const themeStyle = settings.cuteThemeStyle || "kawaii";
    for (const radio of cuteThemeStyleRadios) {
      if (radio.value === themeStyle) {
        radio.checked = true;
        break;
      }
    }

    enableAnimationsCheckbox.checked = settings.enableAnimations !== false;

    // Load floating particles settings
    if (enableFloatingParticlesCheckbox) {
      enableFloatingParticlesCheckbox.checked = settings.enableFloatingParticles !== false;
      if (floatingParticlesOptions) {
        floatingParticlesOptions.style.display = enableFloatingParticlesCheckbox.checked ? 'block' : 'none';
      }
    }

    // Set particle type
    const particleType = settings.particleType || 'hearts';
    for (const radio of particleTypeRadios) {
      if (radio.value === particleType) {
        radio.checked = true;
        if (customParticleUpload) {
          customParticleUpload.style.display = particleType === 'custom' ? 'block' : 'none';
        }
        break;
      }
    }

    // Load custom particle image if exists
    if (settings.customParticleImage) {
      customParticleImageData = settings.customParticleImage;
      customParticleType = settings.customParticleType || 'png';
      
      if (customParticlePreviewImg) {
        customParticlePreviewImg.src = customParticleImageData;
      }
      if (customParticlePreview) {
        customParticlePreview.style.display = 'block';
      }
      if (gifAnimationSettings) {
        gifAnimationSettings.style.display = customParticleType === 'gif' ? 'block' : 'none';
      }
    }

    // Set particle frequency
    if (particleFrequencyInput) {
      particleFrequencyInput.value = settings.particleFrequency || 3;
      if (frequencyValueSpan) {
        frequencyValueSpan.textContent = particleFrequencyInput.value;
      }
    }

    // Set particle speed
    if (particleSpeedInput) {
      particleSpeedInput.value = settings.particleSpeed || 3;
      if (speedValueSpan) {
        speedValueSpan.textContent = particleSpeedInput.value;
      }
    }

    // Set GIF animation delay
    if (gifAnimationDelay) {
      gifAnimationDelay.value = settings.gifAnimationDelay || 100;
      if (gifDelayValue) {
        gifDelayValue.textContent = gifAnimationDelay.value + 'ms';
      }
    }

    // Update preview
    updateBadgePreview();
  });
};

// Initialize
document.addEventListener("DOMContentLoaded", loadSettings);
