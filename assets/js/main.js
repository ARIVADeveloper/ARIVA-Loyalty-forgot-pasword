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
  const button = document.querySelector('button[onclick="resetPin()"]');
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
  const button = document.querySelector('button');

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
    document.querySelector('button').disabled = true;
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
  }
}

function showModal(title, message, isError = true) {
  const modal = document.getElementById('errorModal');
  const modalTitle = modal.querySelector('.modal-title');
  const modalMessage = modal.querySelector('.modal-message');
  const modalIcon = modal.querySelector('.modal-icon');
  const modalButton = modal.querySelector('.modal-button');
  const modalSubtitle = modal.querySelector('.modal-subtitle');
  
  modalTitle.textContent = title;
  modalMessage.innerHTML = message;
  
  if (!isError) {
    modalIcon.innerHTML = '<path class="checkmark" fill="none" stroke="currentColor" stroke-width="2" d="M20 6L9 17L4 12"/>';
    modalSubtitle.style.display = 'block';
    modalButton.textContent = 'Close Window';
    modalButton.disabled = false;
    modalButton.onclick = () => {
      window.close();
      // Fallback if window.close() is blocked
      setTimeout(() => {
        modalSubtitle.textContent = 'Please close this window manually';
        closeModal();
      }, 100);
    };
  } else {
    modalIcon.innerHTML = '<circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.2"/><path fill="currentColor" d="M12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 7.5a1 1 0 011 1v4a1 1 0 01-2 0v-4a1 1 0 011-1z"/>';
    modalSubtitle.style.display = 'none';
    modalButton.textContent = 'Close';
    modalButton.disabled = false;
    modalButton.onclick = closeModal;
  }
  
  modalIcon.classList.toggle('error-icon', isError);
  modalIcon.classList.toggle('success-icon', !isError);
  
  modal.classList.add('show');
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
      document.querySelector('button').disabled = true;
    });
  }
});

// Export functions that need to be globally available
window.resetPin = resetPin;
window.closeModal = closeModal;
window.validatePins = validatePins;