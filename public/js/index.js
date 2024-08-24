/*eslint-disable*/
import '@babel/polyfill';
//Handler Functions
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateUser } from './updateUser';
import { resetPassword } from './resetPassword';
import { forgetPassword } from './forgetPassword';
import { bookTour } from './stripe';
import { signUp } from './signup';
import { showAlert } from './alerts';

//Buttons on the page
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signUpForm = document.querySelector('.form--signup');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserBtn = document.querySelector('.form-user-data');
const updatePwdBtn = document.querySelector('.form-user-password');
const resetPwdBtn = document.querySelector('.form-user-resetPassword');
const forgetPwdBtn = document.querySelector('.form-user-forgetPassword');
const bookTourBtn = document.getElementById('book-tour');
const alertMessage = document.querySelector('body').dataset.alert;

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    await logout();
  });
}

if (updateUserBtn) {
  updateUserBtn.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateUser('settings', form);
  });
}

if (updatePwdBtn) {
  updatePwdBtn.addEventListener('submit', async (e) => {
    e.preventDefault();
    const label = document.querySelector('.btn--savePwd');
    label.textContent = 'updating';
    let currentPassword = document.getElementById('password-current').value;
    let password = document.getElementById('password').value;
    let passwordConfirm = document.getElementById('password-confirm').value;
    await updateUser('password', { currentPassword, password, passwordConfirm });
    label.textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (resetPwdBtn) {
  resetPwdBtn.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('new-password').value;
    const passwordConfirm = document.getElementById('new-password-confirm').value;
    const resetUrl = `${window.location.origin}/api/v1/users/resetPassword/${window.location.pathname.split('/')[2]}`;
    await resetPassword({ password, passwordConfirm }, resetUrl);
  });
}

if (forgetPwdBtn) {
  forgetPwdBtn.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn').textContent = 'SENDING...';
    const email = document.getElementById('email').value;
    await forgetPassword(email);
    document.querySelector('.btn').textContent = 'SEND PASSWORD RESET LINK';
  });
}

if (bookTourBtn) {
  bookTourBtn.addEventListener('click', async (e) => {
    e.target.textContent = `Processing.........`;
    await bookTour(e.target.dataset.tourId);
  });
}

if (signUpForm) {
  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    document.querySelector('.btn--signup').textContent = 'Processing......';
    await signUp({ email, name, password, passwordConfirm });
  });
}

if (alertMessage) showAlert('success', alertMessage);
