import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { QuizzComponent } from './components/quizz/quizz.component';
import { HomeComponent } from './pages/home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CodeExampleComponent } from "./components/code-example/code-example.component";

@NgModule({
  declarations: [
    AppComponent,
    QuizzComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CodeExampleComponent
],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
