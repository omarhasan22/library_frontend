import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service'; // Import AuthService

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm : FormGroup
  message = '';

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private router:Router,
    private tokenService:TokenService,
     private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username:['',Validators.required],
      password:['',Validators.required],
    }) 
  }

login() {
  const formValue = this.loginForm.value;
  this.loginService.login(formValue.username, formValue.password).subscribe({
    next: (res) => {
      this.tokenService.storeAccessToken(res.accessToken);
      this.tokenService.storeRefrshToken(res.refreshToken);
      this.authService.setLoginState(true);  // Update login state
      this.router.navigate(['/']);
    },
    error: (err) => {
      this.message = 'Wrong username or password!!';
    }
  });
}


}
