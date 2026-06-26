import { DeckSource } from '../deckTypes';
import { BackendResolvedDeckProvider } from './BackendResolvedDeckProvider';

export class MeleeDeckProvider extends BackendResolvedDeckProvider {
    public override readonly source = DeckSource.Melee;
    public override readonly displayName = 'melee.gg';
    public override readonly hostNameMatch = 'melee.gg';
    public override readonly tagColor = '#ffa800';
}
