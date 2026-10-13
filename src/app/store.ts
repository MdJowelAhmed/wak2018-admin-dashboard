import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from '@/services/baseApi'
import notificationsReducer from '@/app/notifications/notificationsSlice'
import authReducer from '@/features/auth/authSlice'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    notifications: notificationsReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

