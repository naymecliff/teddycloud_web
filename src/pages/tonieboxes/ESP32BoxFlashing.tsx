import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { TonieboxesSubNav } from "../../components/tonieboxes/TonieboxesSubNav";
import { Alert, Divider, Switch, Typography, message } from "antd";
import { Link } from "react-router-dom";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph, Text } = Typography;

export const ESP32BoxFlashing = () => {
    const { t } = useTranslation();

    const [webHttpOnly, setWebHttpOnly] = useState(false);
    const [httpsActive, setHttpsActive] = useState(false);

    useEffect(() => {
        if (window.location.protocol === "https:") {
            setHttpsActive(true);
        } else {
            setHttpsActive(false);
        }
    }, []);

    useEffect(() => {
        const fetchWebHttpOnly = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/get/core.webHttpOnly`,
                    {
                        method: "GET",
                    }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setWebHttpOnly(data.toString() === "true");
                console.log("data", data);
            } catch (error) {
                console.error("Error fetching web Http only: ", error);
            }
        };

        fetchWebHttpOnly();
    }, []);

    const triggerWriteConfig = async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (error) {
            message.error("Error while saving config to file.");
        }
    };

    const handleChange = async (value: any) => {
        try {
            await fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/set/core.webHttpOnly`, {
                method: "POST",
                body: value?.toString(),
                headers: {
                    "Content-Type": "text/plain",
                },
            });
            triggerWriteConfig();
            setWebHttpOnly(value);

            const httpsPort = process.env.REACT_APP_TEDDYCLOUD_PORT_HTTPS || "";
            const httpPort = process.env.REACT_APP_TEDDYCLOUD_PORT_HTTP || "";

            console.log("http", httpPort);
            console.log("http", process.env.REACT_APP_TEDDYCLOUD_PORT_HTTP);
            console.log("https", httpsPort);

            if (!value && !httpsActive) {
                // Redirect to the HTTPS URL
                const httpsURL = `https://${window.location.host.replace(httpPort, httpsPort)}${
                    window.location.pathname
                }${window.location.search}`;
                window.location.replace(httpsURL);
            } else if (value && httpsActive) {
                // Redirect to the HTTP URL
                const httpURL = `http://${window.location.host.replace(httpsPort, httpPort)}${
                    window.location.pathname
                }${window.location.search}`;
                window.location.replace(httpURL);
            }
        } catch (e) {
            message.error("Error while sending data to server.");
        }
    };

    const ESP32BoxFlashingForm = httpsActive ? (
        <>
            <Alert
                message={t("settings.information")}
                description=<div>
                    Development still in progress - Please use legacy{" "}
                    <Link to={process.env.REACT_APP_TEDDYCLOUD_API_URL + ""} target="_blank">
                        TeddyCloud Administration GUI
                    </Link>{" "}
                    till development is completed.
                </div>
                type="info"
                showIcon
            />
            <Paragraph>Somewhen in future you will be able to do the flashing here.</Paragraph>
        </>
    ) : (
        <>
            <Alert
                message={t("settings.information")}
                description={t("tonieboxes.esp32BoxFlashing.disableHttpOnlyForFlashing")}
                type="info"
                showIcon
            />
        </>
    );

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <TonieboxesSubNav />
                </HiddenDesktop>
                <StyledBreadcrumb
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.esp32BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.esp32BoxFlashing.title`)}</h1>
                    <Paragraph>
                        <Alert
                            message={t("tonieboxes.esp32BoxFlashing.attention")}
                            description={t("tonieboxes.esp32BoxFlashing.hint")}
                            type="warning"
                            showIcon
                        />
                    </Paragraph>
                    <Paragraph>
                        <Switch checked={webHttpOnly} onChange={handleChange} style={{ marginRight: 8 }} />
                        <Text>
                            {t("tonieboxes.esp32BoxFlashing.enabledWebHttpOnly")}
                            {". "}
                            {webHttpOnly
                                ? t("tonieboxes.esp32BoxFlashing.redirectToHttpsAfterDeactivation")
                                : t("tonieboxes.esp32BoxFlashing.redirectToHttpAfterActivation")}
                        </Text>
                    </Paragraph>
                    <Divider>{t("tonieboxes.esp32BoxFlashing.title")}</Divider>
                    {ESP32BoxFlashingForm}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
