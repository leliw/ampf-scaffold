import { Injectable } from '@angular/core';
import { BaseDictionaryService } from '../../shared/base-dictionary.service';

export interface RoleDto {
  name: string;
  description: string;
}


@Injectable({
  providedIn: 'root'
})
export class RoleService extends BaseDictionaryService<RoleDto> {
  protected override endpoint = 'roles';
  protected override keyName: keyof RoleDto = 'name';
}
