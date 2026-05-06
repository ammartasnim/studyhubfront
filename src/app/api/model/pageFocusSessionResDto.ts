import { PageableObject } from './pageableObject';
import { FocusSessionResDto } from './focusSessionResDto';
import { SortObject } from './sortObject';


export interface PageFocusSessionResDto { 
    totalElements?: number;
    totalPages?: number;
    size?: number;
    content?: Array<FocusSessionResDto>;
    number?: number;
    first?: boolean;
    last?: boolean;
    numberOfElements?: number;
    sort?: SortObject;
    pageable?: PageableObject;
    empty?: boolean;
}

