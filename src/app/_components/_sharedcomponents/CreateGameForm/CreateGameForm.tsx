import React, { useState, FormEvent, ChangeEvent } from "react";
import { usePathname } from "next/navigation";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Select from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import classnames from "classnames";


interface CreateGameFormProps {
  format?: string | null;
  setFormat?: (format: string) => void;
}

const deckOptions: string[] = [
  "Vader Green Ramp",
  "Obi-Wan Blue Control",
  "Darth Red Aggro",
  "Leia White Midrange",
];

const formatOptions: string[] = ["Premier", "Twin Suns", "Draft", "Sealed"];

const SelectItem = React.forwardRef<HTMLDivElement, Select.SelectItemProps>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <Select.Item
        className={classnames("SelectItem", className)}
        {...props}
        ref={forwardedRef}
      >
        <Select.ItemText>{children}</Select.ItemText>
        <Select.ItemIndicator className="SelectItemIndicator">
          <CheckIcon />
        </Select.ItemIndicator>
      </Select.Item>
    );
  }
);

const CreateGameForm: React.FC<CreateGameFormProps> = ({ format, setFormat }) => {
  const pathname = usePathname();
  const isCreateGamePath = pathname === "/creategame";

  // Common State
  const [favouriteDeck, setFavouriteDeck] = useState<string>("Vader Green Ramp");
  const [deckLink, setDeckLink] = useState<string>("");
  const [saveDeck, setSaveDeck] = useState<boolean>(false);

  // Additional State for Non-Creategame Path
  const [gameName, setGameName] = useState<string>("");
  const [privacy, setPrivacy] = useState<string>("Public");

  // Handle Create Game Submission
  const handleCreateGameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Favourite Deck:", favouriteDeck);
    console.log("SWUDB Deck Link:", deckLink);
    console.log("Save Deck To Favourites:", saveDeck);

    if (!isCreateGamePath) {
      console.log("Game Name:", gameName);
      console.log("Format:", format);
      console.log("Privacy:", privacy);
    }

    // TODO: Implement actual game creation logic here
  };

  return (
    <div className="container black-bg">
      <h2>{isCreateGamePath ? "Choose Your Deck" : "Create New Game"}</h2>
      <form onSubmit={handleCreateGameSubmit}>
        {/* Favourite Decks Input */}
        <div className="form-element">
          <label className="label">Favorite Decks</label>
          <Select.Root value={favouriteDeck} onValueChange={setFavouriteDeck}>
            <Select.Trigger className="SelectTrigger" aria-label="Favourite Decks">
              <Select.Value placeholder="Select a deck…" />
              <Select.Icon className="SelectIcon"><ChevronDownIcon /></Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="SelectContent">
                <Select.ScrollUpButton className="SelectScrollButton"><ChevronUpIcon /></Select.ScrollUpButton>
                <Select.Viewport className="SelectViewport">
                  {deckOptions.map((deck) => (
                    <SelectItem key={deck} value={deck}>
                      {deck}
                    </SelectItem>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton className="SelectScrollButton"><ChevronDownIcon /></Select.ScrollDownButton>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* SWUDB Deck Link Input */}
        <div className="form-element-slim">
          <label className="label"><a href="https://www.swudb.com/" target="_blank">SWUDB</a> or <a href="https://www.sw-unlimited-db.com/" target="_blank">SW-Unlimited-DB</a> Deck Link <span className="secondary">(use the url or 'Deck Link' button)</span></label>
          <input
            id="deckLink"
            type="url"
            value={deckLink}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDeckLink(e.target.value)}
            required
            className="input"
          />
        </div>

        {/* Save Deck To Favourites Checkbox */}
        <div className="form-element">
          <div style={{ display: "flex", alignItems: "center" }}>
            <Checkbox.Root 
            className="CheckboxRoot" 
            id="saveDeck"
            checked={saveDeck}
            onCheckedChange={(checked) => setSaveDeck(!!checked)}
            >
              <Checkbox.Indicator className="CheckboxIndicator">
                <CheckIcon />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <label className="label-inline">
              Save to Favorite Decks
            </label>
          </div>
        </div>

        {/* Additional Fields for Non-Creategame Path */}
        {!isCreateGamePath && (
          <>
            {/* Game Name Input */}
            <div className="form-element">
              <label className="label">
                Game Name <span className="secondary">(optional)</span>
              </label>
              <input
                id="gameName"
                type="text"
                value={gameName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setGameName(e.target.value)}
                placeholder="Enter Game Name"
                className="input"
              />
            </div>

            {/* Format Selection */}
            <div className="form-element">
              <label className="label">Format</label>
              <Select.Root
                value={format || ""}
                onValueChange={(value) => setFormat && setFormat(value)}
              >
                <Select.Trigger className="SelectTrigger" aria-label="Format">
                  <Select.Value placeholder="Select a format..." />
                  <Select.Icon className="SelectIcon">
                    <ChevronDownIcon />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="SelectContent">
                    <Select.ScrollUpButton className="SelectScrollButton">
                      <ChevronUpIcon />
                    </Select.ScrollUpButton>
                    <Select.Viewport className="SelectViewport">
                      {formatOptions.map((fmt) => (
                        <SelectItem key={fmt} value={fmt}>
                          {fmt}
                        </SelectItem>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton className="SelectScrollButton">
                      <ChevronDownIcon />
                    </Select.ScrollDownButton>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Privacy Selection */}
            <div className="form-element">
              <label className="label">Game Privacy</label>
              <RadioGroup.Root
                value={privacy}
                onValueChange={(value) => setPrivacy(value)}
                className="RadioGroupRoot"
              >
                <div className="radio-container">
                  <div className="radio-option">
                    <RadioGroup.Item className="RadioGroupItem" value="Public" id="public">
                      <RadioGroup.Indicator className="RadioGroupIndicator" />
                    </RadioGroup.Item>
                    <label htmlFor="public" className="label-inline">Public</label>
                  </div>
                  <div className="radio-option">
                    <RadioGroup.Item className="RadioGroupItem" value="Private" id="private">
                      <RadioGroup.Indicator className="RadioGroupIndicator" />
                    </RadioGroup.Item>
                    <label htmlFor="private" className="label-inline">Private</label>
                  </div>
                </div>
              </RadioGroup.Root>
            </div>
          </>
        )}

        {/* Submit Button */}
        <button type="submit" className="button button-centered">
          Create Game
        </button>
      </form>

      {/* Secondary Card - Instructions (Only for /creategame path) */}
      {isCreateGamePath && (
        <div className="card">
          <h3>Instructions</h3>
          <p>
            Choose a deck, then click 'Create' to be taken to the game lobby.
            <br />
            <br />
            Once in the lobby, the player who wins the dice roll chooses who goes first.
            Then the host can start the game.
            <br />
            <br />
            Have Fun!
          </p>
        </div>
      )}
    </div>
  );
};

export default CreateGameForm;