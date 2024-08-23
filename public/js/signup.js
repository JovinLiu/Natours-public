/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const signUp = async (data) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/signup',
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Sign up successfully!');
      window.setTimeout(() => {
        location.assign('/tours');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
