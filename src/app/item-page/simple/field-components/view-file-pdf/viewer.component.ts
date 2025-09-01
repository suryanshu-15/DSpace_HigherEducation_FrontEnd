import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { RemoteData } from 'src/app/core/data/remote-data';
import { Item } from 'src/app/core/shared/item.model';
import { MetadataMap } from 'src/app/core/shared/metadata.models';
import { hasValue } from 'src/app/shared/empty.util';

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

  metadata$: Observable<{ label: string; key: string; value: any[] }[]> | null = null;
  private readonly BASE = 'http://localhost:8080';

  // 🔹 Key → Label mapping
  private keyToLabel: Record<string, string> = {
    'dc.contributor.author': 'Department',
    'dc.title': 'Section',
    'dc.title.alternative': 'File Number',
    'dc.publisher': 'File Name',
    'dc.date.issued': 'File Year',
    'dc.identifier.citation': 'Respondent',
    'dc.relation.ispartofseries': 'Case Number',
    'dc.identifier': 'Compliant',
  };

  // 🔹 Desired display order
  private sortOrder = [
    'dc.contributor.author',
    'dc.title',
    'dc.title.alternative',
    'dc.publisher',
    'dc.date.issued',
    'dc.identifier.citation',
    'dc.relation.ispartofseries',
    'dc.identifier',
  ];
  itemRD$: any;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

    

    // Handle route params (UUID of the file + item metadata)
    this.route.paramMap.subscribe((pm) => {
      const uuid = pm.get('UUID');
      console.log(uuid)
      if (!uuid) {
        this.error = true;
        this.loading = false;
        console.error('Missing :UUID in route');
        return;
      }
      this.fetchPdf(uuid);
      
      this.metadata$ = this.itemRD$.pipe(
      map((rd: RemoteData<Item>) => rd.payload),
      filter((item: Item) => hasValue(item)),
      map((item: Item) => {
        const metadataObj: MetadataMap = item.metadata;
        return this.sortOrder
          .filter(key => metadataObj[key])
          .map(key => ({
            key,
            label: this.keyToLabel[key],
            value: metadataObj[key]
          }));
      })
    );
    console.log(this.metadata$)

    });
  }

  private fetchPdf(uuid: string) {
    this.loading = true;
    this.error = false;

    const url = `${this.BASE}/server/api/core/bitstreams/${uuid}/content`;

    this.http
      .get(url, {
        responseType: 'blob',
        withCredentials: true,
      })
      .subscribe({
        next: (blob) => {
          const objUrl = URL.createObjectURL(blob);
          this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objUrl);
          this.loading = false;
        },
        error: (err) => {
          console.error('PDF fetch failed:', err);
          this.error = true;
          this.loading = false;
        },
      });
  }

  downloadPdf() {
    if (!this.fileUrl) return;
    const a = document.createElement('a');
    a.href = (this.fileUrl as any).changingThisBreaksApplicationSecurity;
    a.download = 'document.pdf';
    a.click();
  }

  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.25, 5);
  }
  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.25);
  }
  resetZoom() {
    this.zoomLevel = 1.0;
  }
}
