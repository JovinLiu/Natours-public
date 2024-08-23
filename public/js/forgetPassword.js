/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const forgetPassword = async (email) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/forgetPassword',
      data: { email },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Reset link sent, please check your email!');
      window.setTimeout(() => {
        location.assign('/');
      }, 5000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
