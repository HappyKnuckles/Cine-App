import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilmDataService {
  url: string = "https://proxy-server-rho-pearl.vercel.app/api/server";
  params = {
    bereich: 'portal',
    modul_id: '101',
    klasse: 'vorstellungen',
    cli_mode: '1',
    com: '',
  };

  constructor(private http: HttpClient,
  ) { }

  async fetchNewFilms() {
    this.params.com = 'anzeigen_vorankuendigungen'
    const formData = new URLSearchParams();
    formData.append('filter[genres_tags_not][]', '185305');
    // formData.append('filter[extra][]', 'vorverkauf');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded', // Set the content type to URL-encoded
    });

    try {
      const response: any = await firstValueFrom(
        this.http.post(this.url, formData.toString(), {
          params: this.params,
          headers: headers,
        })
      );

      return response?.daten?.items ?? [];
    } catch (error) {
      throw error;
    }
  }

  async fetchFilmData(formData: FormData) {
    this.params.com = "anzeigen_spielplan"
    try {
      // Append the params as URL parameters
      const fullURL = `${this.url}?${new URLSearchParams(this.params).toString()}`;

      const formBody = this.formDataToUrlEncoded(formData); // Convert FormData to URL-encoded string

      const response = await fetch(fullURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        // Handle HTTP errors
        throw new Error(`HTTP Error: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  formDataToUrlEncoded(formData: any) {
    const formBody = [];
    for (let pair of formData.entries()) {
      const encodedKey = encodeURIComponent(pair[0]);
      const encodedValue = encodeURIComponent(pair[1]);
      formBody.push(`${encodedKey}=${encodedValue}`);
    }
    return formBody.join('&');
  }
}
