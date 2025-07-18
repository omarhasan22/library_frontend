import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {

  isLoggedIn = false ;
  isAdmin = true;
  isSidebarCollapsed = false;



  constructor(private authService: AuthService,private router:Router,) {
}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });

//       this.authService.getUserData().subscribe((data: {
//         user: any; role: string; 
// }) => {
//         console.log("data ",data);
        
//       this.isAdmin = data.user.role == 'admin';
//     }, (error: any) => {
//       console.error('Error fetching user data:', error);
//       this.isAdmin = false; // Default to false if there's an error
//     });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);

  }


}
