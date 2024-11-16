import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ArticleService } from './service/article.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { catchError, tap } from 'rxjs/operators';
import {
  FormControl,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { debounceTime, Subject, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatOptionModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    CommonModule,
    NgIf,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  articleService = inject(ArticleService);
  sanitizer = inject(DomSanitizer);
  isLoading: boolean = false;
  isLoadingOcr: boolean = false;
  article: any = {};
  articles: any = [];
  pubdateFormatted: string = '';
  title = 'Frontend';
  selectedDate: string = '';
  publications: any[] = [];
  selectedPublication: { PublicationTitle: string; Edition: string } = {
    PublicationTitle: 'Financial Express',
    Edition: 'Delhi',
  }; // To hold the selected publication
  filteredPublications: any[] = [];
  articlesPageNumber: any[] = [];
  selectedPageNumber: string = '';
  selectedPrimaryID: number = 0;
  articleTitles: any[] = [];
  filterArticleTitles: any[] = [];
  selectedArticleId: string = '';
  keywords: { keyid: string; PrimarykeyID: string; keyword: string }[] = []; // To hold keyid and keyword
  filterKeyword: { keyword: string }[] = [];
  filterString: any[] = [];
  additionalKeyowrds: { keyword: string }[] = [];
  page_Number: {
    pageNumber: string;
    fullText: string;
    pageName: string;
    imageDirectory: string;
    Image_Name: string;
    md5id: string;
    start_acq_time: Date;
    end_acq_time: Date;
  }[] = [];
  timeTaken = '';
  baseUrl = '';
  url = '';
  isCopied = false;
  showdetails: boolean = false;
  getTotalNoOfArticles: boolean = false;
  highlightedText: SafeHtml = '';
  titleControl = new FormControl(); // Form control for autocomplete
  publicationControl = new FormControl('');
  searchTerms = new Subject<string>(); // Subject to handle input changes
  keywordFilterString: boolean = false;

  ngOnInit() {
    this.selectedDate = this.formatDate(new Date());
    this.getPublications();
    this.searchTerms
      .pipe(
        debounceTime(300), // Adjust the debounce time as needed
        switchMap((term) => this.filterPublications(term))
      )
      .subscribe((filteredPublications) => {
        this.filteredPublications = filteredPublications;
        this.isLoading = false; // Set loading to true while filtering or fetching
      });
    this.isLoading = false; // Set loading to true while filtering or fetching

    this.publicationControl.valueChanges.subscribe((value) => {
      this.isLoading = true; // Set loading to true while filtering or fetching
      this.searchTerms.next(value || '');
    });
  }

  // getPublications() {
  //   this.articleService.getPublications().subscribe((result) => {
  //     console.log(result);
  //     this.publications = result;
  //   });
  // }
  getPublications() {
    this.articleService
      .getPublications()
      .pipe(
        tap((result) => {
          // console.log(result);
          this.publications = result;
        }),
        catchError((error) => {
          console.error('Error fetching publications:', error);
          // Return an empty array or a suitable fallback value
          return of([]); // Replace with appropriate fallback
        })
      )
      .subscribe();
  }

  formatDate(dateString: Date): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Extract the year, month, and day in 'YYYY-MM-DD' format
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-indexed
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  formatDateAndTime(dateString: Date): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Extract the year, month, and day in 'YYYY-MM-DD' format
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-indexed
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  onDateChange(e: string) {
    this.selectedDate = e;
    this.showdetails = false;
    if (this.articlesPageNumber !== null) {
      this.articlesPageNumber =  [];
      this.articlesPageNumber = [];
      this.filterArticleTitles = []
      this.titleControl.reset();

    
    }
        // this.getTotalArticles(this.selectedDate);
  }

  onPublicationChange(event: Event) {
    this.showdetails = false;

    this.isLoading = true;
    const selectElement = event.target as HTMLSelectElement;
    // console.log(selectElement.value);
    const selectedPublication = this.publications.find(
      (publication) =>
        publication.PublicationTitle + ' ' + publication.Edition ===
        selectElement.value
    );
    // console.log(selectedPublication);
    this.selectedPublication = selectedPublication;
    this.getTotalNoOfArticles = true;
    this.getTotalArticles(this.selectedDate);
  }

  getTotalArticles(pubdate: string) {
    const PublicationTitle = this.selectedPublication?.PublicationTitle;
    const Edition = this.selectedPublication?.Edition;

    this.articleService
      .getTotalArticles(pubdate, PublicationTitle, Edition)
      .subscribe((result) => {
        console.log(result);
        const uniquePageNumbers = new Set();
        this.articlesPageNumber = result.filter((article: any) => {
          if (!uniquePageNumbers.has(article.Page_Number)) {
            uniquePageNumbers.add(article.Page_Number); // Add the Page_Number to the Set
            return true; // Keep this article
          }
          return false; // Skip duplicate articles
        });
        console.log(this.articlesPageNumber);

        // this.articlesPageNumber = result;
        // this.filterArticleTitles = [];
        const uniqueTitles = new Set<string>(); // We assume ArticleTitle is a string

        // Filter out duplicate titles
        this.filterArticleTitles = result.filter((article: any) => {
          if (!uniqueTitles.has(article.ArticleTitle)) {
            uniqueTitles.add(article.ArticleTitle); // Add the unique title to the Set
            return true; // Keep the article with this title
          }
          return false; // Skip the article if the title is already in the Set
        });

        console.log(this.filterArticleTitles);
        this.articleTitles = this.filterArticleTitles;

        this.titleControl.reset();
        // this.filterTitle();
        // if (this.articlesPageNumber.length == 0) {
        // }
        this.isLoading = false;
      });
  }

  onPageNumberChange(event: Event) {
    this.isLoading = true;
    const selectElement = event.target as HTMLSelectElement;
    this.selectedPageNumber = String(selectElement.value);
    // console.log(this.selectedPageNumber);

    // Fetch articles for the selected page number
    if (this.selectedPageNumber !== null) {
      this.getArticlesByPageNo(this.selectedDate, this.selectedPageNumber);
    }
  }

  onKeywordFilterString(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedPrimaryID = Number(selectElement.value);
    // console.log(this.selectedPrimaryID);

    // Fetch articles for the selected page number
    if (this.selectedPrimaryID !== 0) {
      this.articleService
        .getFilterString(this.selectedPrimaryID)
        .subscribe((result) => {
          // console.log(result);
          this.filterString = result;
          this.keywordFilterString = true;
        });
    } else {
      this.filterString = [];
      this.keywordFilterString = false;
    }
  }

  getArticlesByPageNo(pubdate: string, pageNumber: string) {
    const PublicationTitle = this.selectedPublication?.PublicationTitle;
    const Edition = this.selectedPublication?.Edition;

    this.articleService
      .getArticlesByPageNumber(pubdate, PublicationTitle, Edition, pageNumber)
      .subscribe((result) => {
        console.log(result);
        this.titleControl.reset();
        this.articleTitles = result;
        this.filterArticleTitles = result; // Initialize filtered list
        // Handle the result as needed
        this.isLoading = false;
      });
  }

  onArticleIdChange(event: Event) {
    // this.showdetails = true;
    const selectElement = event.target as HTMLSelectElement;
    this.selectedArticleId = selectElement.value;
    // console.log(this.selectedArticleId);
    this.additionalKeyowrds = [];
    this.keywordFilterString = false;
  }

  getFullArticle() {
    // if (form.invalid) {
    //   form.form.markAllAsTouched(); // Ensure all form controls are marked as touched
    //   return; // Prevent form submission
    // }
    this.isLoading = true;
    if (this.filterArticleTitles.length > 0) {
      this.articleService
        .getFullTextByID(this.selectedArticleId)
        .subscribe((result) => {
          this.isLoading = false;
          this.showdetails = true;
          // console.log(result);
          this.article = result[0];
          // console.log(this.article.Fname);
          // console.log(this.article.Lname);

          if (this.article.ave) {
            this.article.ave = parseFloat(this.article.ave).toFixed(2);
          }

          this.articles = result;
          this.keywords = [];
          result.forEach((article: any) => {
            const { keyid, PrimarykeyID, MergedKeywordFilter } = article;
            const exists = this.keywords.some((item) => item.keyid === keyid);

            // If keyid is not found in the keywords array, add it
            if (!exists) {
              this.keywords.push({
                keyid: keyid,
                PrimarykeyID: PrimarykeyID,
                keyword: MergedKeywordFilter,
              });
            }
          });

          this.page_Number = [];
          result.forEach((article: any) => {
            const {
              Page_Number,
              pagename,
              full_text,
              imagedirectory,
              Image_name,
              md5id,
              start_acq_time,
              end_acq_time,
            } = article;

            // Check if keyid already exists in keywords array
            const exists = this.page_Number.some(
              (item) => item.pageNumber === Page_Number
            );

            // If keyid is not found in the keywords array, add it
            if (!exists) {
              this.page_Number.push({
                pageNumber: Page_Number,
                pageName: pagename,
                fullText: full_text,
                imageDirectory: imagedirectory,
                Image_Name: Image_name,
                md5id: md5id,
                start_acq_time: start_acq_time,
                end_acq_time: end_acq_time,
              });
            }
            // console.log(this.page_Number);
          });

          this.baseUrl = 'https://myimpact.in/backup';
          this.url = `${this.baseUrl}/${this.article.imagedirectory}/${this.article.Image_name}`;
          this.getTimeTaken(
            this.article.start_acq_time,
            this.article.end_acq_time
          );
          this.highlightedText = this.article.full_text;
          this.selectedPrimaryID = 0;
          // this.additionalKeyowrds = [];
        });
    } else {
      this.article = '';
      this.highlightedText = '';
      this.keywords = [];
      this.timeTaken = '';
      // form.form.markAllAsTouched(); // Ensure all form controls are marked as touched
    }
  }

  viewArticle() {
    if (this.page_Number.length > 0) {
      // console.log(this.article);
      const imagedirectory =
        this.article.imageDirectory || this.page_Number[0].imageDirectory;
      const Image_name =
        this.article.Image_Name || this.page_Number[0].Image_Name;
      const baseUrl = 'https://myimpact.in/backup';
      const url = `${baseUrl}/${imagedirectory}/${Image_name}`;
      // const url = `${baseUrl}/${page.imageDirectory}/${page.Image_Name}`;
      window.open(url, '_blank');
    } else {
      console.error('No page number data available');
    }
  }

  viewPDF() {
    if (this.page_Number.length > 0) {
      const baseUrl = 'https://myimpact.in/clip_admin.php';
      const url = `${baseUrl}?id=${this.page_Number[0].md5id}`;
      // const url = `${baseUrl}/${page.imageDirectory}/${page.Image_Name}`;
      window.open(url, '_blank');
    } else {
      console.error('No page number data available');
    }
  }

  getTextOnPageNumber(pageNumber: string) {
    this.isLoading = true;
    // console.log(pageNumber);
    // this.pageNumber = pageNumber

    // Find the full text for the selected page number
    const selectedPage = this.page_Number.find(
      (page) => page.pageNumber === pageNumber
    );
    if (selectedPage) {
      this.highlightedText = selectedPage.fullText;
      this.article.full_text = selectedPage.fullText;
      this.article.Page_Number = selectedPage.pageNumber;
      this.article.pagename = selectedPage.pageName;
      this.article.imageDirectory = selectedPage.imageDirectory;
      this.article.Image_Name = selectedPage.Image_Name;
      (this.article.start_acq_time = selectedPage.start_acq_time),
        (this.article.end_acq_time = selectedPage.end_acq_time);
      // console.log(this.article.full_text);
      this.getTimeTaken(this.article.start_acq_time, this.article.end_acq_time);
    }
    this.baseUrl = 'https://myimpact.in/backup';
    this.url = `${this.baseUrl}/${this.article.imageDirectory}/${this.article.Image_Name}`;
    // console.log(this.url);
    this.isLoading = false;
  }

  filterPublications(value: string) {
    if (!value.trim()) {
      return of([]);
      // return of(this.publications);
    }

    const inputValue = value.toLowerCase().trim();
    const filtered = this.publications.filter((publication) =>
      `${publication.PublicationTitle} ${publication.Edition}`
        .toLowerCase()
        .includes(inputValue)
    );
    return of(filtered);
  }

  // filterPublications(value: string) {
  //   this.filteredPublications = this.publications;
  //   const inputValue = value.toLowerCase().trim() || '';
  //   if (inputValue) {
  //     this.filteredPublications = this.publications.filter(
  //       (publication) => {
  //         const combinedText = `${publication.PublicationTitle} ${publication.Edition}`.toLowerCase();
  //         return combinedText.includes(inputValue);

  //         // publication.PublicationTitle.toLowerCase().includes(inputValue) ||
  //         // publication.Edition.toLowerCase().includes(inputValue)
  //   });
  //   } else {
  //     this.filteredPublications = this.publications;
  //   }
  //   // this.changeDetectorRef.detectChanges()
  //   console.log(this.filteredPublications);
  //   // this.getTotalNoOfArticles = true
  // }

  filterTitle() {
    this.isLoading = true;
    const inputValue = this.titleControl.value?.toLowerCase() || '';
    // this.getPublications()
    if (inputValue !== '') {
      this.filterArticleTitles = this.articleTitles.filter((article) =>
        article.ArticleTitle.toLowerCase().includes(inputValue)
      );
      this.isLoading = false;
    } else {
      this.filterArticleTitles = this.articleTitles;
      this.isLoading = false;
    }
    // this.isLoading = true
    //  else {
    //   this.filterArticleTitles = [];
    //    this.isLoading = false;
    // }

    // console.log(this.filterArticleTitles);
  }

  getTimeTaken(start_acq_time: Date, end_acq_time: Date) {
    const start_time = new Date(start_acq_time);
    const end_time = new Date(end_acq_time);

    // Calculate the difference in milliseconds
    const timeDifferenceInMilliseconds =
      end_time.getTime() - start_time.getTime();
    // console.log('timeDifferenceInMilliseconds: ', timeDifferenceInMilliseconds);

    // Convert milliseconds to seconds
    const millisecondsInASecond = 1000;
    const totalSeconds = timeDifferenceInMilliseconds / millisecondsInASecond;

    // Convert total seconds to minutes and seconds
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Preserve exact decimal value
    const actualTime = minutes + seconds / 60;
    const formattedActualTime = actualTime.toString().split('.');

    if (formattedActualTime[1]) {
      // Ensure the decimal part is exactly one digit
      formattedActualTime[1] = formattedActualTime[1].substring(0, 1);
    } else {
      // If no decimal part exists, add ".0"
      formattedActualTime[1] = '0';
    }

    this.timeTaken = `${formattedActualTime[0]}.${formattedActualTime[1]}`;
    // console.log(this.timeTaken);
  }

  ocr() {
    this.isLoadingOcr = true;
    this.additionalKeyowrds = [];
    // console.log(this.url);

    this.articleService.getOcrText(this.url).subscribe((result) => {
      // console.log(result.text);

      // Properly escape text for JSON
      const processedText = result.text
        .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2') // Merge hyphenated words
        .replace(/(?<!\n)\n(?!\n)/g, ' ') // Keep single newlines as single newline
        // .replace(/\n/g, ' ') // Replace single newline with space
        .replace(/\n\n/g, '\n') // Replace double newlines with single newline
        .replace(/'/g, "\\'"); // Escape single quotes

      // Properly escape text for JSON
      const processedText1 = result.text
        .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
        .replace(/(?<!\n)\n(?!\n)/g, ' ') // Keep single newlines as single newline
        // .replace(/\n/g, ' ')
        .replace(/\n\n/g, '\n'); // Replace double newlines with single newline

      // console.log(processedText);
      const userid = 'rsharma';
      const pubid = this.article.PubID;
      // console.log(pubid);

      if (processedText) {
        this.articleService
          .getAddKeywords(userid, processedText, pubid)
          .subscribe((result) => {
            result.forEach((element: any) => {
              // console.log(element.Keyword);
              // Check if the keyword already exists in the keywords array
              const exists = this.keywords.some(
                (keyword) => keyword.keyword === element.Keyword
              );
              if (!exists) {
                this.additionalKeyowrds.push({ keyword: element.Keyword });
                // console.log(this.additionalKeyowrds);
              }
            });
            this.highlightedText = this.highlightKeywords(processedText1);
            // console.log(this.highlightedText);
            this.isLoadingOcr = false;
          });
      }
    });
  }

  highlightKeywords(text: string) {
    let highlightedText = text;
    // console.log("Before highlighting: ", highlightedText );

    // Highlight additional keywords first
    this.additionalKeyowrds.forEach((keyword) => {
      const regex = new RegExp(`\\b(${keyword.keyword})\\b`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        `<span style="background-color: lightblue; font-weight: bold;">$1</span>`
      );
    });

    // Highlight main keywords with inline CSS
    this.keywords.forEach((keyword) => {
      const regex = new RegExp(`(\\b${keyword.keyword}\\b)`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        `<span style="background-color: yellow; font-weight: bold;">$1</span>`
      );
    });

    highlightedText = highlightedText.replace(/(<span[^>]*>)+<\/span>/g, ''); // Remove empty spans

    // console.log("After highlighting: ", highlightedText);

    return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
  }

  onTitleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.article.ArticleTitle = input.value;
    // console.log(this.article.ArticleTitle);

    // this.updateTitle();
  }

  onSubTitleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.article.Sub_Title = input.value;
    // console.log(this.article.Sub_Title);
  }

  editCheckBox(event: Event) {
    const input = event.target as HTMLInputElement;
    switch (input.id) {
      case 'inlineCheckbox1':
        this.article.IsPremium = input.checked ? 'Y' : ' ';
        break;
      case 'inlineCheckbox2':
        this.article.IsPhoto = input.checked ? 'Y' : ' ';
        break;
      case 'inlineCheckbox3':
        this.article.IsColor = input.checked ? 'Y' : ' ';
        break;
      default:
        console.warn('Unexpected checkbox ID');
    }
  }

  onPagenumberChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.article.Page_Number = input.value;
    // console.log(this.article.Page_Number);
  }

  onJourChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const newJourName = input.value.trim(); // Trim any leading or trailing whitespace
    if (newJourName) {
      const names = newJourName.split(' ');
      this.article.Fname = names[0] || ''; // First name is the first part
      // Assign last name; join everything after the first name and trim spaces
      this.article.Lname = names.slice(1).join(' ').trim();
    } else {
      // Optionally handle empty input
      this.article.Fname = '';
      this.article.Lname = '';
    }
    // console.log(
    //   `First Name: ${this.article.Fname}, Last Name: ${this.article.Lname}`
    // );
  }

  onPageNameChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.article.pagename = input.value;
    // console.log(this.newPageNumber);
  }

  async save() {
    try {
      // console.log(this.article.Fname);
      // console.log(this.article.Lname);

      // const input = event.target as HTMLInputElement;
      await this.updateTitle();
      await this.updatePage();
      await this.updateJour();
      // alert("Updated");
      // await this.getFullArticle();
    } catch (error) {
      console.error('Error during save process:', error);
      // Optionally display a user-friendly message
      alert('An error occurred while saving. Please try again.');
    }
  }

  async notSave() {
    try {
      await this.getFullArticle();
    } catch (error) {
      console.error('Error during not save process:', error);
    }
  }

  updateTitle(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.articleService
        .editArticle(
          this.selectedArticleId,
          this.article.ArticleTitle,
          this.article.Sub_Title,
          this.article.IsPremium,
          this.article.IsPhoto,
          this.article.IsColor
        )
        .subscribe(
          (result) => {
            // console.log(result);
            resolve(result);
          },
          (error) => reject(error)
        );
    });
  }

  updatePage(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.articleService
        .editPage(
          this.selectedArticleId,
          this.article.Page_Number,
          this.article.Page_Number,
          this.article.pagename
        )
        .subscribe(
          (result) => {
            // console.log(result);
            resolve(result);
          },
          (error) => reject(error)
        );
    });
  }

  updateJour(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.articleService
        .editJour(
          this.selectedArticleId,
          this.article.Fname,
          this.article.Lname
        )
        .subscribe(
          (result) => {
            // console.log(this.article.Fname);
            // console.log(this.article.Lname);

            // console.log(result);
            resolve(result);
          },
          (error) => reject(error)
        );
    });
  }

  copyToClipboard() {
    const textElement = document.getElementById('highlightedText');
    if (textElement) {
      const text = textElement.innerText; // Use innerText to get plain text
      navigator.clipboard.writeText(text).then(
        () => {
          this.isCopied = true; // Change icon to checkmark
          setTimeout(() => {
            this.isCopied = false; // Revert back to copy icon after 2 seconds
          }, 2000);
        },
        (err) => {
          console.error('Failed to copy text: ', err);
        }
      );
    } else {
      console.warn('Text element not found');
    }
  }
}
