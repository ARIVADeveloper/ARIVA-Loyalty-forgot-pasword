import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBebWNO8Qwaxiina0N-_i18tkLFNBoGRpM",
  authDomain: "ariva-loyalty-3c618.firebaseapp.com",
  projectId: "ariva-loyalty-3c618",
  appId: "1:1099259920063:web:bbac7b689036f250a1900a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Helper function to validate a 5-digit PIN
function isValidPin(pin) {
  return /^\d{5}$/.test(pin);
}

// Helper: Always return 6-char string for Firebase while keeping 5-digit UI validation
function formatPin(pin) {
  // Ensure we have a 5-digit PIN before padding
  if (!/^\d{5}$/.test(pin)) {
    throw new Error("PIN must be exactly 5 digits");
  }
  // Pad to 6 digits for Firebase requirement
  return pin.padEnd(6, "0");
}

function validatePins() {
  const pin = document.getElementById("pin");
  const confirmPin = document.getElementById("confirmPin");
  const button = document.getElementById("resetButton");
  const pinValidation = pin.nextElementSibling.nextElementSibling;
  const confirmValidation = confirmPin.nextElementSibling.nextElementSibling;
  
  // Get PIN values
  const pin1 = pin.value.trim();
  const pin2 = confirmPin.value.trim();

  // Reset validation states
  pin.classList.remove('error');
  confirmPin.classList.remove('error');
  pinValidation.textContent = '';
  confirmValidation.textContent = '';
  pinValidation.classList.remove('match');
  confirmValidation.classList.remove('match');
  
  // Validate first PIN
  if (pin1.length > 0 && !/^\d+$/.test(pin1)) {
    pinValidation.textContent = 'Numbers only';
    pin.classList.add('error');
    button.disabled = true;
    return;
  }

  // Check if PINs match when both have 5 digits
  if (pin1.length === 5 && pin2.length === 5) {
    if (pin1 === pin2 && /^\d+$/.test(pin1)) {
      confirmValidation.textContent = '✓ PINs match';
      confirmValidation.classList.add('match');
      button.disabled = false;
      return;
    } else {
      confirmValidation.textContent = 'PINs do not match';
      confirmPin.classList.add('error');
    }
  }

  // If we get here, disable the button
  button.disabled = true;
}

async function resetPin() {
  const params = new URLSearchParams(window.location.search);
  const oobCode = params.get("oobCode");
  const pinInput = document.getElementById("pin");
  const confirmPinInput = document.getElementById("confirmPin");
  const pin = pinInput.value.trim();
  const confirmPin = confirmPinInput.value.trim();
  const messageEl = document.getElementById("message");
  const button = document.getElementById("resetButton");

  // Clear previous states
  messageEl.className = "";
  messageEl.innerText = "";
  pinInput.classList.remove('error');
  confirmPinInput.classList.remove('error');

  if (!/^\d{5}$/.test(pin)) {
    pinInput.classList.add('error');
    messageEl.className = "show";
    messageEl.innerText = "PIN must be exactly 5 digits";
    return;
  }

  if (pin !== confirmPin) {
    confirmPinInput.classList.add('error');
    messageEl.className = "show";
    messageEl.innerText = "PINs do not match";
    return;
  }

  // Show loading state
  button.classList.add('loading');
  button.disabled = true;
  pinInput.disabled = true;
  confirmPinInput.disabled = true;

  // Pad the PIN to 6 digits for Firebase
  const adjustedPin = formatPin(pin);

  try {
    await confirmPasswordReset(auth, oobCode, adjustedPin);
    showModal(
      "PIN Reset Successful!",
      "Your PIN has been successfully reset. You can now use your new PIN to log in to the ARIVA Loyalty app.",
      false
    );
    document.getElementById('pin').disabled = true;
    document.getElementById('confirmPin').disabled = true;
    document.getElementById('resetButton').disabled = true;
  } catch (error) {
    let title = "Error";
    let message = "An error occurred while resetting your PIN.";

    switch(error.code) {
      case 'auth/expired-action-code':
        title = "Link Expired";
        message = "This reset link has expired. Please request a new one.";
        break;
      case 'auth/invalid-action-code':
        title = "Link Already Used";
        message = "This reset link has already been used. Please request a new one if needed.";
        break;
      case 'auth/weak-password':
        title = "Invalid PIN";
        message = "Please ensure your PIN is exactly 5 digits.";
        break;
    }
    
    showModal(title, message);
    
    // Reset form state
    button.classList.remove('loading');
    button.disabled = true; // Keep disabled until validation passes
    pinInput.disabled = false;
    confirmPinInput.disabled = false;
    validatePins(); // Re-run validation
  } finally {
    button.classList.remove('loading');
  }
}

function showModal(title, message, isError = true) {
  const modal = document.getElementById('errorModal');
  const modalContent = modal.querySelector('.modal-content');
  const modalTitle = modal.querySelector('.modal-title');
  const modalMessage = modal.querySelector('.modal-message');
  const modalIcon = modal.querySelector('.modal-icon');
  const modalButton = modal.querySelector('.modal-button');
  const modalSubtitle = modal.querySelector('.modal-subtitle');
  
  // Set common modal content
  modalTitle.textContent = title;
  modalMessage.innerHTML = message;
  
  // Clear previous classes
  modalIcon.classList.remove('error-icon', 'success-icon');
  modalButton.disabled = false;
  modalContent.classList.remove('loading');
  
  if (!isError) {
    // Success state - PIN reset successful
    setupSuccessModal(modalIcon, modalSubtitle, modalButton, modalContent);
  } else {
    // Error state
    setupErrorModal(modalIcon, modalSubtitle, modalButton);
  }
  
  modal.classList.add('show');
}

function setupSuccessModal(modalIcon, modalSubtitle, modalButton, modalContent) {
  // Success icon
  modalIcon.innerHTML = '<path class="checkmark" fill="none" stroke="currentColor" stroke-width="2" d="M20 6L9 17L4 12"/>';
  modalIcon.classList.add('success-icon');
  
  // Success message
  modalSubtitle.textContent = 'You can safely close this window now.';
  modalSubtitle.style.display = 'block';
  
  // Button setup
  modalButton.textContent = 'Close Window';
  modalButton.onclick = () => handleWindowClose(modalContent, modalButton, modalSubtitle);
}

function setupErrorModal(modalIcon, modalSubtitle, modalButton) {
  // Error icon
  modalIcon.innerHTML = '<path d="M11 15h2v2h-2zm0-8h2v6h-2zm1-4C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>';
  modalIcon.setAttribute('viewBox', '0 0 24 24');
  modalIcon.classList.add('error-icon');
  
  // Hide subtitle for errors
  modalSubtitle.style.display = 'none';
  
  // Button setup
  modalButton.textContent = 'Close';
  modalButton.onclick = () => closeModal();
}

function handleWindowClose(modalContent, modalButton, modalSubtitle) {
  // Show loading state
  modalContent.classList.add('loading');
  modalButton.disabled = true;
  modalButton.textContent = 'Closing...';
  
  // Try multiple methods to close the window
  let windowClosed = false;
  
  // Method 1: Try to close through opener
  if (window.opener && !window.opener.closed) {
    try {
      window.opener.postMessage('closeResetWindow', '*');
      windowClosed = true;
    } catch (e) {
      console.log('Failed to close through opener');
    }
  }
  
  // Method 2: Try direct window.close()
  if (!windowClosed) {
    try {
      window.close();
      windowClosed = true;
    } catch (e) {
      console.log('Direct window.close() failed');
    }
  }
  
  // Method 3: Try to navigate away
  if (!windowClosed) {
    try {
      window.location.href = 'about:blank';
      windowClosed = true;
    } catch (e) {
      console.log('Navigation failed');
    }
  }
  
  // If all methods failed, show manual close message
  setTimeout(() => {
    if (!windowClosed) {
      modalContent.classList.remove('loading');
      modalButton.disabled = false;
      modalButton.textContent = 'Close Window';
      modalSubtitle.textContent = 'Please close this window manually using your browser controls';
      modalSubtitle.style.display = 'block';
    }
  }, 2000);
}

function closeModal() {
  const modal = document.getElementById('errorModal');
  modal.classList.remove('show');
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Add input listeners to both PIN fields to ensure numbers only and proper validation
  const pinInputs = ["pin", "confirmPin"];
  pinInputs.forEach(id => {
    const input = document.getElementById(id);
    
    // Prevent non-numeric input
    input.addEventListener("keypress", function(e) {
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    });

    // Handle paste events - strip non-numeric characters
    input.addEventListener("paste", function(e) {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const numericOnly = pastedText.replace(/\D/g, '').slice(0, 5);
      this.value = numericOnly;
      validatePins();
    });

    // Clean up any non-numeric characters and validate
    input.addEventListener("input", function() {
      this.value = this.value.replace(/\D/g, '').slice(0, 5);
      validatePins();
    });
  });

  // Check if the link is valid on page load
  const params = new URLSearchParams(window.location.search);
  const oobCode = params.get("oobCode");
  
  if (!oobCode) {
    showModal(
      "Invalid Link",
      "This reset link appears to be invalid. Please make sure you're using the complete link from your email."
    );
  } else {
    // Verify the action code
    auth.verifyPasswordResetCode(oobCode).catch(error => {
      let title, message;
      
      switch(error.code) {
        case 'auth/expired-action-code':
          title = "Link Expired";
          message = "This reset link has expired. Please request a new one.";
          break;
        case 'auth/invalid-action-code':
          title = "Link Already Used";
          message = "This reset link has already been used. Please request a new one if needed.";
          break;
        default:
          title = "Error";
          message = "This reset link is no longer valid. Please request a new one.";
      }
      
      showModal(title, message);
      document.getElementById('pin').disabled = true;
      document.getElementById('resetButton').disabled = true;
    });
  }
});

// Form submission handler
function handleFormSubmit(e) {
  e.preventDefault();
  resetPin();
}

// Toggle PIN visibility function
function togglePinVisibility(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling.querySelector('svg path');
  
  if (input.type === "password") {
    input.type = "number";
    icon.setAttribute('d', 'M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25ZM12 15.75C10.07 15.75 8.5 14.18 8.5 12.25C8.5 10.32 10.07 8.75 12 8.75C13.93 8.75 15.5 10.32 15.5 12.25C15.5 14.18 13.93 15.75 12 15.75Z');
  } else {
    input.type = "password";
    icon.setAttribute('d', 'M12 5.25C7.92 5.25 4.25 7.92 4.25 12C4.25 16.08 7.92 18.75 12 18.75C16.08 18.75 19.75 16.08 19.75 12C19.75 7.92 16.08 5.25 12 5.25ZM12 15.75C10.07 15.75 8.5 14.18 8.5 12.25C8.5 10.32 10.07 8.75 12 8.75C13.93 8.75 15.5 10.32 15.5 12.25C15.5 14.18 13.93 15.75 12 15.75Z');
  }
}

// Export functions that need to be globally available
window.resetPin = resetPin;
window.closeModal = closeModal;
window.validatePins = validatePins;
window.togglePinVisibility = togglePinVisibility;
window.handleFormSubmit = handleFormSubmit;