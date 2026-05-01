import { Configuration } from './configuration';

export class CustomConfiguration extends Configuration {
  override isJsonMime(mime: string): boolean {
    if (mime === '*/*') return true;
    return super.isJsonMime(mime);
  }
}