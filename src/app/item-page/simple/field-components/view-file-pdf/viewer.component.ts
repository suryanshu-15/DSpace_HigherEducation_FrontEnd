import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-pdf-viewer',
  imports: [CommonModule],
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
})
export class ViewerComponent {
  fileUrl: SafeResourceUrl | null = null;
  loading = true;
  error = false;
  zoomLevel = 1.0;

  private readonly BASE = 'http://localhost:8080';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false; // SSR – skip
      return;
    }

    // Handle first load + any param changes while staying on the same component
    this.route.paramMap.subscribe(pm => {
      const uuid = pm.get('UUID');
      if (!uuid) {
        this.error = true;
        this.loading = false;
        console.error('Missing :UUID in route');
        return;
      }
      this.fetchPdf(uuid);
    });
  }

  private fetchPdf(uuid: string) {
    this.loading = true;
    this.error = false;

    const url = `${this.BASE}/server/api/core/bitstreams/${uuid}/content`;

    this.http.get(url, {
      responseType: 'blob',
      withCredentials: true, // keep true if your API uses session cookies
    }).subscribe({
      next: (blob) => {
        const objUrl = URL.createObjectURL(blob);
        this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objUrl);
        this.loading = false;
      },
      error: (err) => {
        console.error('PDF fetch failed:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  zoomIn()     { this.zoomLevel = Math.min(this.zoomLevel + 0.25, 5); }
  zoomOut()    { this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.25); }
  resetZoom()  { this.zoomLevel = 1.0; }
}




// import { Component, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { ActivatedRoute } from '@angular/router';
// import { firstValueFrom } from 'rxjs';

// @Component({
//   standalone: true,
//   selector: 'app-pdf-viewer',
//   imports: [CommonModule],
//   templateUrl: './viewer.component.html',
//   styleUrls: ['./viewer.component.scss'],
// })
// export class ViewerComponent {
//   @ViewChild('pdfHost', { static: true }) pdfHost!: ElementRef<HTMLDivElement>;

//   isBrowser = false;
//   isLoading = true;
//   errorMsg = '';

//   pdfDoc: any = null;
//   pdfjsLib: any = null;
//   currentPage = 1;
//   totalPages = 0;
//   zoom = 1.0;

//   private readonly BASE = 'http://localhost:8080';

//   constructor(
//     private http: HttpClient,
//     private route: ActivatedRoute,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {}

//   async ngOnInit() {
//     this.isBrowser = isPlatformBrowser(this.platformId);
//     if (!this.isBrowser) {
//       this.isLoading = false;
//       return;
//     }

//     try {
//       // Load browser-friendly legacy PDF.js build
//       const [pdfjsLib, workerEntry] = await Promise.all([
//         import('pdfjs-dist/legacy/build/pdf'),
//         import('pdfjs-dist/legacy/build/pdf.worker.entry'),
//       ]);
//       this.pdfjsLib = pdfjsLib;
//       this.pdfjsLib.GlobalWorkerOptions.workerSrc = workerEntry;

//       const uuid = this.route.snapshot.paramMap.get('UUID');
//       if (!uuid) throw new Error('Missing :UUID route param');

//       const url = `${this.BASE}/server/api/core/bitstreams/${uuid}/content`;
//       const blob = await firstValueFrom(
//         this.http.get(url, { responseType: 'blob', withCredentials: true })
//       );
//       const data = await blob.arrayBuffer();

//       const loadingTask = this.pdfjsLib.getDocument({ data });
//       this.pdfDoc = await loadingTask.promise;

//       this.totalPages = this.pdfDoc.numPages;
//       this.currentPage = 1;
//       this.isLoading = false;

//       await this.renderPage(this.currentPage);
//     } catch (err: any) {
//       console.error('PDF viewer init error:', err);
//       this.errorMsg = err?.message || 'Failed to load PDF';
//       this.isLoading = false;
//     }
//   }

//   private async renderPage(pageNum: number) {
//     if (!this.pdfDoc) return;

//     const page = await this.pdfDoc.getPage(pageNum);
//     const viewport = page.getViewport({ scale: this.zoom });

//     const host = this.pdfHost.nativeElement;
//     host.innerHTML = '';

//     const canvas = document.createElement('canvas');
//     canvas.style.maxWidth = '100%';
//     canvas.style.height = 'auto';
//     const ctx = canvas.getContext('2d')!;

//     canvas.width = Math.floor(viewport.width);
//     canvas.height = Math.floor(viewport.height);

//     host.appendChild(canvas);

//     await page.render({ canvasContext: ctx, viewport }).promise;
//   }

//   // Navigation
//   async prevPage() {
//     if (this.currentPage > 1) {
//       this.currentPage--;
//       await this.renderPage(this.currentPage);
//     }
//   }

//   async nextPage() {
//     if (this.currentPage < this.totalPages) {
//       this.currentPage++;
//       await this.renderPage(this.currentPage);
//     }
//   }

//   // Zoom controls
//   async zoomIn() {
//     this.zoom = Math.min(this.zoom + 0.25, 5);
//     await this.renderPage(this.currentPage);
//   }

//   async zoomOut() {
//     this.zoom = Math.max(this.zoom - 0.25, 0.25);
//     await this.renderPage(this.currentPage);
//   }

//   async resetZoom() {
//     this.zoom = 1.0;
//     await this.renderPage(this.currentPage);
//   }

//   ngOnDestroy() {
//     try {
//       this.pdfDoc?.destroy?.();
//     } catch {}
//   }
// }
