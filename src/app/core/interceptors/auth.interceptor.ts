import { HttpInterceptorFn } from '@angular/common/http';
import { authStore } from '../../store/auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = authStore.token();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
