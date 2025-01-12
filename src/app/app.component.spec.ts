// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import {
//   AppComponent,
//   AuthService,
//   CallState,
//   IAuthService,
//   LoginStore,
// } from './app.component';
// import { HttpErrorResponse } from '@angular/common/http';
// import { NotificationService } from '@my-workspace/shared/util-common';
// import { ReactiveFormsModule } from '@angular/forms';
// import { AuthStore } from '@my-workspace/shared/util-auth';
// import { computed, signal } from '@angular/core';
// import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

// describe('LoginStore', () => {
//   let store: ReturnType<any>;
//   let authServiceMock: jest.Mocked<IAuthService>;

//   beforeEach(() => {
//     authServiceMock = {
//       login: jest.fn(),
//     };

//     TestBed.configureTestingModule({
//       providers: [
//         LoginStore,
//         { provide: AuthService, useValue: authServiceMock },
//       ],
//     });

//     store = TestBed.inject(LoginStore);
//   });

//   it('should initialize with default state', () => {
//     expect(store.username()).toBe('');
//     expect(store.password()).toBe('');
//     expect(store.callState()).toBe('init');
//   });

//   it('should update state and set loading during login', async () => {
//     authServiceMock.login.mockResolvedValue();
//     await store.login('testUser', 'testPass');

//     expect(store.username()).toBe('testUser');
//     expect(store.password()).toBe('testPass');
//     expect(authServiceMock.login).toHaveBeenCalledWith('testUser', 'testPass');
//   });

//   it('should set loaded state after successful login', async () => {
//     authServiceMock.login.mockResolvedValue();
//     await store.login('testUser', 'testPass');
//     expect(store.callState()).toBe('loaded');
//   });

//   it('should handle auth error', async () => {
//     const error = new HttpErrorResponse({
//       error: { message: 'Invalid credentials' },
//       status: 401,
//     });
//     authServiceMock.login.mockRejectedValue(error);

//     await store.login('testUser', 'wrongPass');
//     expect(store.callState()).toEqual({
//       status: 'error',
//       error: 'Invalid credentials',
//     });
//   });

//   it('should handle unknown error', async () => {
//     const error = new HttpErrorResponse({
//       error: { message: 'Server Error' },
//       status: 500,
//     });
//     authServiceMock.login.mockRejectedValue(error);

//     await store.login('testUser', 'testPass');
//     expect(store.callState()).toEqual({
//       status: 'error',
//       error: 'Server Error',
//     });
//   });
// });

// const mockModules = {
//   RouterModule: { forRoot: () => ({}) },
//   MatFormFieldModule: {},
//   MatInputModule: {},
//   MatIconModule: {},
//   MatButtonModule: {},
//   MatProgressSpinnerModule: {},
// };




// // describe('LoginStore Integration', () => {
// //   let store: any;
// //   let httpMock: HttpTestingController;
// //   let authService: AuthService;

// //   beforeEach(() => {
// //     TestBed.configureTestingModule({
// //       imports: [HttpClientTestingModule],
// //       providers: [LoginStore, AuthService]
// //     });

// //     store = TestBed.inject(LoginStore);
// //     httpMock = TestBed.inject(HttpTestingController);
// //     authService = TestBed.inject(AuthService);
// //   });

// //   afterEach(() => {
// //     httpMock.verify();
// //   });

// //   it('should handle successful login flow', async () => {
// //     const loginPromise = store.login('test', 'password');
    
// //     const req = httpMock.expectOne('https://localhost:5001/api/account/login');
// //     expect(req.request.method).toBe('POST');
// //     expect(req.request.body).toEqual({ username: 'test', password: 'password' });
    
// //     req.flush({});
// //     await loginPromise;

// //     expect(store.username()).toBe('test');
// //     expect(store.loaded()).toBe(true);
// //   });

// //   it('should handle server error', async () => {
// //     const loginPromise = store.login('test', 'wrong');
    
// //     const req = httpMock.expectOne('https://localhost:5001/api/account/login');
// //     req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    
// //     await loginPromise;
// //     expect(store.error()).toBe('Invalid credentials');
// //   });
// // });