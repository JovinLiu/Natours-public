/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const resetPassword = async (data, resetUrl) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: resetUrl,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Update successfully!');
      window.setTimeout(() => {
        location.assign('/tours');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
