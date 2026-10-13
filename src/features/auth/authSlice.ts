import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {},
  reducers: {
    logout: () => {
      localStorage.removeItem('admin_token');
    },
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
