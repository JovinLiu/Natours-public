/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const updateUser = async (type, data) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: type === 'password' ? '/api/v1/users/updateMyPassword' : '/api/v1/users/updateMe',
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Update successfully!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
