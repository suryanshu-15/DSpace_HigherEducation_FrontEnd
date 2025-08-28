import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Bitstream } from 'src/app/core/shared/bitstream.model';

@Component({
  selector: 'ds-view-pdf',
  templateUrl: './view-pdf.component.html',
  styleUrls: ['./view-pdf.component.scss'],
  standalone: true
})
export class ViewPdfComponent implements OnChanges {
  @Input() bitstream: Bitstream;

  pdfUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    if (this.bitstream?._links?.content?.href) {
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.bitstream._links.content.href
      );
    }
  }
}
