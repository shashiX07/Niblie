/**
 * Options page for Viewport Word Counter
 */

// Default settings
const DEFAULT_SETTINGS = {
  position: 'top-right',
  showWordCount: true,
  colorStyle: 'solid',
  badgeColor: '#4285f4',
  textColor: '#ffffff',
  gradientStart: '#4285f4',
  gradientEnd: '#0F9D58',
  gradientAngle: 45,
  opacity: 90,
  useCuteTheme: false,
  cuteThemeStyle: 'kawaii',
  enableAnimations: false
  
};

// DOM Elements
const positionButtons = document.querySelectorAll('.position-btn');
const showWordCount = document.getElementById('show-word-count');
const styleTabs = document.querySelectorAll('.tab-btn');
const solidOptions = document.getElementById('solid-options');
const gradientOptions = document.getElementById('gradient-options');
const badgeColorInput = document.getElementById('badge-color');
const textColorInput = document.getElementById('text-color');
const gradientStartInput = document.getElementById('gradient-start');
const gradientEndInput = document.getElementById('gradient-end');
const gradientAngleInput = document.getElementById('gradient-angle');
const badgeOpacityInput = document.getElementById('opacity-slider');
const saveButton = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');
const badgePreview = document.querySelector('.badge-preview');

// New theme controls
const useCuteThemeCheckbox = document.getElementById('use-cute-theme');
const cuteThemeOptions = document.getElementById('cute-theme-options');
const cuteThemeStyleRadios = document.getElementsByName('cute-theme-style');
const enableAnimationsCheckbox = document.getElementById('enable-animations');

// Helper functions
const updateColorValue = (input, valueDisplay) => {
  valueDisplay.textContent = input.value.toUpperCase();
};

const updateRangeValue = (input, valueDisplay, unit = '') => {
  valueDisplay.textContent = `${input.value}${unit}`;
};

const updateBadgePreview = () => {
  // Get current values
  const isShowingWordCount = showWordCount.checked;
  const opacity = badgeOpacityInput.value / 100;
  let bgColor;
  
  // Get the current color style tab
  const colorTab = document.querySelector('.tab-btn.active').dataset.tab;

  if (colorTab === 'solid') {
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
  badgePreview.textContent = isShowingWordCount ? '123 words' : '';

  // Cute theme handling
  const useCuteTheme = useCuteThemeCheckbox.checked;
  let cuteThemeStyle = 'kawaii';
  for (const radio of cuteThemeStyleRadios) {
    if (radio.checked) {
      cuteThemeStyle = radio.value;
      break;
    }
  }

  badgePreview.className = 'badge-preview';
  badgePreview.style.fontFamily = '';
  badgePreview.style.border = '';

  if (isShowingWordCount) {
    if (useCuteTheme) {
      // Apply cute theme styling to preview
      badgePreview.classList.add(cuteThemeStyle);

      // Define emojis for each theme
      const emojis = {
        'kawaii': '📝',
        'pastel': '✏️',
        'bubbly': '📚'
      };

      badgePreview.innerHTML = `<span style="font-size: 16px; margin-right: 5px;">${emojis[cuteThemeStyle]}</span><span>123 words</span>`;
      badgePreview.style.display = 'flex';
      badgePreview.style.alignItems = 'center';
      badgePreview.style.borderRadius = '18px';
      badgePreview.style.padding = '8px 15px';
    } else {
      // Regular styling
      if (colorTab === 'solid') {
        badgePreview.style.backgroundColor = badgeColorInput.value;
      } else {
        const angle = gradientAngleInput.value;
        badgePreview.style.background = `linear-gradient(${angle}deg, ${gradientStartInput.value}, ${gradientEndInput.value})`;
      }

      badgePreview.style.color = textColorInput.value;
      badgePreview.textContent = '123 words';
    }
  } else {
    // Show icon-only badge
    if (useCuteTheme) {
      badgePreview.classList.add(cuteThemeStyle);

      const emojis = {
        'kawaii': '📝',
        'pastel': '✏️',
        'bubbly': '📚'
      };

      badgePreview.innerHTML = `<span style="font-size: 16px;">${emojis[cuteThemeStyle]}</span>`;
      badgePreview.style.width = '40px';
      badgePreview.style.height = '40px';
      badgePreview.style.borderRadius = '50%';
      badgePreview.style.padding = '0';
      badgePreview.style.display = 'flex';
      badgePreview.style.alignItems = 'center';
      badgePreview.style.justifyContent = 'center';
    } else {
      badgePreview.textContent = '📊';
      badgePreview.style.width = '32px';
      badgePreview.style.height = '32px';
      badgePreview.style.borderRadius = '50%';
      badgePreview.style.display = 'flex';
      badgePreview.style.alignItems = 'center';
      badgePreview.style.justifyContent = 'center';
      badgePreview.style.padding = '0';

      if (colorTab === 'solid') {
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
positionButtons.forEach(button => {
  button.addEventListener('click', () => {
    positionButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    updateBadgePreview();
  });
});

// Show/hide word count toggle
showWordCount.addEventListener('change', updateBadgePreview);

// Style tabs handling
styleTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    styleTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    if (tab.dataset.tab === 'solid') {
      solidOptions.style.display = 'flex';
      gradientOptions.style.display = 'none';
    } else {
      solidOptions.style.display = 'none';
      gradientOptions.style.display = 'flex';
    }

    updateBadgePreview();
  });
});

// Color input handling
document.querySelectorAll('input[type="color"]').forEach(input => {
  const valueDisplay = input.parentElement.querySelector('.color-value');
  input.addEventListener('input', () => {
    updateColorValue(input, valueDisplay);
    updateBadgePreview();
  });
});

// Range input handling
gradientAngleInput.addEventListener('input', () => {
  updateRangeValue(gradientAngleInput, gradientAngleInput.nextElementSibling, '°');
  updateBadgePreview();
});

badgeOpacityInput.addEventListener('input', () => {
  updateRangeValue(badgeOpacityInput, badgeOpacityInput.nextElementSibling, '%');
  updateBadgePreview();
});

// Cute theme toggle visibility logic
useCuteThemeCheckbox.addEventListener('change', function() {
  cuteThemeOptions.style.display = this.checked ? 'block' : 'none';
  updateBadgePreview();
});

// Update preview when theme style changes
cuteThemeStyleRadios.forEach(radio => {
  radio.addEventListener('change', updateBadgePreview);
});

// Enable animations toggle
enableAnimationsCheckbox.addEventListener('change', updateBadgePreview);

// Save settings
saveButton.addEventListener('click', () => {
  // Get current settings
  const settings = {
    position: document.querySelector('.position-btn.active').dataset.position,
    showWordCount: showWordCount.checked,
    colorStyle: document.querySelector('.tab-btn.active').dataset.tab,
    badgeColor: badgeColorInput.value,
    textColor: textColorInput.value,
    gradientStart: gradientStartInput.value,
    gradientEnd: gradientEndInput.value,
    gradientAngle: parseInt(gradientAngleInput.value),
    opacity: parseInt(badgeOpacityInput.value),
    useCuteTheme: useCuteThemeCheckbox.checked,
    cuteThemeStyle: Array.from(cuteThemeStyleRadios).find(radio => radio.checked).value,
    enableAnimations: enableAnimationsCheckbox.checked
  };

  // Save to storage
  chrome.storage.sync.set({ settings }, () => {
    statusMessage.textContent = 'Settings saved!';
    statusMessage.style.color = 'var(--success)';
    setTimeout(() => {
      statusMessage.textContent = '';
    }, 3000);
  });
});

// Load saved settings
const loadSettings = () => {
  chrome.storage.sync.get('settings', (data) => {
    const settings = data.settings || DEFAULT_SETTINGS;

    // Apply settings to UI
    document.querySelector(`.position-btn[data-position="${settings.position}"]`).classList.add('active');
    showWordCount.checked = settings.showWordCount;

    if (settings.colorStyle === 'gradient') {
      document.querySelector('.tab-btn[data-tab="gradient"]').click();
    }

    badgeColorInput.value = settings.badgeColor;
    updateColorValue(badgeColorInput, badgeColorInput.parentElement.querySelector('.color-value'));

    textColorInput.value = settings.textColor;
    updateColorValue(textColorInput, textColorInput.parentElement.querySelector('.color-value'));

    gradientStartInput.value = settings.gradientStart;
    updateColorValue(gradientStartInput, gradientStartInput.parentElement.querySelector('.color-value'));

    gradientEndInput.value = settings.gradientEnd;
    updateColorValue(gradientEndInput, gradientEndInput.parentElement.querySelector('.color-value'));

    gradientAngleInput.value = settings.gradientAngle;
    updateRangeValue(gradientAngleInput, gradientAngleInput.nextElementSibling, '°');

    badgeOpacityInput.value = settings.opacity;
    updateRangeValue(badgeOpacityInput, badgeOpacityInput.nextElementSibling, '%');

    // Cute theme settings
    useCuteThemeCheckbox.checked = settings.useCuteTheme !== false;
    cuteThemeOptions.style.display = useCuteThemeCheckbox.checked ? 'block' : 'none';

    const themeStyle = settings.cuteThemeStyle || 'kawaii';
    for (const radio of cuteThemeStyleRadios) {
      if (radio.value === themeStyle) {
        radio.checked = true;
        break;
      }
    }

    enableAnimationsCheckbox.checked = settings.enableAnimations !== false;

    // Update preview
    updateBadgePreview();
  });
};

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);