import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as cheerio from 'cheerio';
import { Observable, catchError, firstValueFrom, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebscraperService {

  constructor(private http: HttpClient) { }

  async scrapeData(filmHref: any) {
    const proxyURL = "https://proxy-server-rho-pearl.vercel.app/api/server";
    try {
      const html = await fetch(`${proxyURL}?url=${filmHref}`).then((res) =>
        res.text()
      );
      const $ = cheerio.load(html);
      let filmData: any = {};
      const filmInfoJson = await this.getFilmInfoJson($);      
      const trailerUrl = await this.getTrailerUrl($);

      filmData = { ...filmData, ...filmInfoJson, ...trailerUrl };

      return filmData;
    } catch (error) {
      console.error("Error fetching Data:", error);
      return undefined;
    }
  }

  async getScriptContents($: any, keyword: any) {
    return $('script[type="text/javascript"]')
      .toArray()
      .map((script: any) => $(script).html())
      .filter((content: string | any[]) => content?.includes(keyword));
  }

  async extractDataFromScript(
    scriptContents: any,
    regex: RegExp,
    splitBy: any = null,
    decode = false,
    json = false
  ) {
    if (scriptContents.length === 0) {
      // console.log("No matching" + scriptContents + "found");
      return;
    }

    const match = scriptContents[0]?.match(regex);

    if (!match || match.length <= 1) {
      // console.log("No match with" + regex + "found");
      return;
    }

    let data = match[1];

    data = data.replace(/\\u([\d\w]{4})/gi, function (match: any, grp: string) {
      return String.fromCharCode(parseInt(grp, 16));
    });

    if (decode) {
      data = decodeURIComponent(data.replace(/\\\//g, "/"));
    }

    if (json) {
      try {
        console.log(data);
        const jsonData = JSON.parse(data);
        console.log(jsonData);
        return jsonData.map((item: { text: any; }) => item.text);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return;
      }
    }

    if (splitBy) {
      const splitData = data.split(splitBy).map((name: string) => name.trim());
      return splitData.map((name: { split: (arg0: string) => [any, any]; }) => {
        const [vorname, nachname] = name.split(" ");
        return { vorname, nachname };
      });
    }

    return data;
  }

  async getTrailerUrl($: cheerio.CheerioAPI) {
    const scriptContents = await this.getScriptContents($, "var videos");
    let trailerUrl = await this.extractDataFromScript(
      scriptContents,
      /"video_url":"([^"]+)"/,
      null,
      true
    );
    let trailerPreviewUrl = await this.extractDataFromScript(
      scriptContents,
      /"video_vorschau_pfad_bild":"([^"]+)"/,
      null,
      true);
      return {trailerUrl, trailerPreviewUrl}
  }

  async getFilmInfoJson($: cheerio.CheerioAPI){
    const scriptContents = await this.getScriptContents($, "var filminfos");
    var startIndex = scriptContents[0].indexOf('{');
    var endIndex = scriptContents[0].lastIndexOf('}') + 1;
    var jsonStr = scriptContents[0].substring(startIndex, endIndex);    
    var json = JSON.parse(jsonStr);
    return json;
}
}
