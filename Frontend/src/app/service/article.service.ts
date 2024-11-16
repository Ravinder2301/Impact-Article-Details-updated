import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private apiUrl = 'http://localhost:3000';

  constructor(private httpClient: HttpClient) {}

  getFullTextByID(articleID: string): Observable<any> {
    return this.httpClient.post<any>(`${this.apiUrl}/getFullTextById`, {
      articleID,
    });
  }

  getPublications(): Observable<any> {
    return this.httpClient.get(this.apiUrl + '/getPublications');
  }

  getTotalArticles(
    pubdate: string,
    pub: string,
    edition: string
  ): Observable<any> {
    return this.httpClient.post<any>(`${this.apiUrl}/getArticles`, {
      pubdate,
      pub,
      edition,
    });
  }

  getArticlesByPageNumber(
    pubdate: string,
    pub: string,
    edition: string,
    pageNumber: string
  ): Observable<any> {
    return this.httpClient.post<any>(`${this.apiUrl}/getArticlesByPageNo`, {
      pubdate,
      pub,
      edition,
      pageNumber,
    });
  }

  editArticle(
    id: string,
    title: string,
    sub_title: string,
    isPremium: string,
    isPhoto: string,
    isColor: string
  ) {
    return this.httpClient.put<any>(`${this.apiUrl}/editArticle`, {
      id,
      title,
      sub_title,
      isPremium,
      isPhoto,
      isColor,
    });
  }

  editPage(
    id: string,
    old_page_number: string,
    new_page_number: string,
    page_name: string
  ) {
    return this.httpClient.put<any>(`${this.apiUrl}/editPage`, {
      id,
      old_page_number,
      new_page_number,
      page_name,
    });
  }

  editJour(id: string, fname: string, lname: string) {
    return this.httpClient.put<any>(`${this.apiUrl}/editJour`, {
      id,
      fname,
      lname,
    });
  }

  getOcrText(imageurl: string) {
    return this.httpClient.post<any>(`https://beta.myimpact.in:5400/ocr`, {
      imageurl,
    });
  }

  getFilterString(PrimarykeyID: number) {
    return this.httpClient.post<any>(`${this.apiUrl}/getFilterString`, {
      PrimarykeyID,
    });
  }

  getAddKeywords(userid: string, text: string, pubid: number) {
    return this.httpClient.post<any>(`${this.apiUrl}/additionalKeywords`, {
      userid,
      text,
      pubid,
    });
  }
}
