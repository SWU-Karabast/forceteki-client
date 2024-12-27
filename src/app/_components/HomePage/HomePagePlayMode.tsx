import React, { useEffect } from "react";
import { Typography, Box, Tab, Tabs, Card, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import CreateGameForm from "../_sharedcomponents/CreateGameForm/CreateGameForm";

const HomePagePlayMode: React.FC = () => {
    const router = useRouter();
    const [value, setValue] = React.useState(0);
    const [testGameList, setTestGameList] = React.useState([]);
    const isDevEnv = process.env.NODE_ENV === "development";

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    }

    const handleStartTestGame = async (filename: string) => {

        try {
			// const payload = {
			// 	user: user,
			// 	deck: deckData
			// };
			const response = await fetch("http://localhost:9500/api/start-test-game",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({filename: filename}),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to start test game");
			}

			router.push("/GameBoard");
	
		} catch (error) {
			console.error(error);
		}

    }

    useEffect(() => {
        const fetchGameList = async () => {
            try {
                const response = await fetch("http://localhost:9500/api/test-game-setups",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
    
                if (!response.ok) {
                    throw new Error("Failed to get test game list");
                }
    
                const data = await response.json();
                setTestGameList(data);
    
            } catch (error) {
                console.error(error);
            }
        };
        fetchGameList();
    }, []);

    const styles = {
        tabStyles: {
            color: "white",
        }
    };

    return (
        <Box sx={{ height: "100%" }}>
            <Card variant="black">
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs value={value} variant="fullWidth" onChange={handleChange}>
                        <Tab sx={styles.tabStyles} label="Play" />
                        <Tab sx={styles.tabStyles} label="Create" />
                        {isDevEnv && <Tab sx={styles.tabStyles} label="Test" />}
                    </Tabs>
                </Box>
                <TabPanel index={0} value={value}>
                    <Box>PlayGame</Box>
                </TabPanel>
                <TabPanel index={1} value={value}>
                    <CreateGameForm format={'Premier'} />
                </TabPanel>
                {isDevEnv && 
                    <TabPanel index={2} value={value}>
                        <Box pt={2}>
                            <Typography variant="h6">Test Game Setups</Typography>
                            {testGameList.map((filename, index) => {
                                return (
                                    <Button sx={{marginTop: 2}} key={index} onClick={() => handleStartTestGame(filename)}>
                                        {filename}
                                    </Button>
                                );
                            })}
                        </Box>
                    </TabPanel>
                }
            </Card>
        </Box>
    );
};

interface ITabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<ITabPanelProps> = (props) => {
    const { children, value, index } = props;

    return (
        <Box
            component="div"
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
        >
            {children}
        </Box>
    );
};

export default HomePagePlayMode;