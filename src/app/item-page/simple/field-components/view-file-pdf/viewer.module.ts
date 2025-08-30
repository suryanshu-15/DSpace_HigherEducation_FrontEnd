import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { SafePipeModule } from "./safe-pipe.module"
import { ThemedFileDownloadLinkComponent } from "src/app/shared/file-download-link/themed-file-download-link.component"

@NgModule({
  declarations: [],
  imports: [CommonModule, SafePipeModule, ThemedFileDownloadLinkComponent],
  exports: [],
})
export class ViewerModule {}

