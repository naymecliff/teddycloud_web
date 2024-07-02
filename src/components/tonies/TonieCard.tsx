import {
    CloseOutlined,
    CloudSyncOutlined,
    DownloadOutlined,
    EditOutlined,
    FolderOpenOutlined,
    InfoCircleOutlined,
    PlayCircleOutlined,
    RetweetOutlined,
    SaveFilled,
} from "@ant-design/icons";
import { Button, Card, Divider, Input, Modal, Tooltip, Typography, message, theme } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAudioContext } from "../audio/AudioContext";
import { FileBrowser } from "../utils/FileBrowser";
import { TonieArticleSearch } from "./TonieArticleSearch";
import LanguageFlagSVG from "../../utils/languageUtil";
import { RadioStreamSearch } from "../utils/RadioStreamSearch";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";
import TonieInformationModal from "../utils/TonieInformationModal";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Meta } = Card;
const { Text } = Typography;
const { useToken } = theme;

export type TagsTonieCardList = {
    tags: TonieCardProps[];
};

export type TagTonieCard = {
    tagInfo: TonieCardProps;
};

export type TonieInfo = {
    series: string;
    episode: string;
    language: string;
    model: string;
    picture: string;
    tracks: string[];
};
export type TonieCardProps = {
    uid: string;
    ruid: string;
    type: string;
    valid: boolean;
    exists: boolean;
    claimed: boolean;
    hide: boolean;
    live: boolean;
    nocloud: boolean;
    hasCloudAuth: boolean;
    source: string;
    audioUrl: string;
    downloadTriggerUrl: string;
    tonieInfo: TonieInfo;
    sourceInfo: TonieInfo;
};

export const TonieCard: React.FC<{
    tonieCard: TonieCardProps;
    lastRUIDs: Array<[string, string, string]>;
    overlay: string;
    readOnly: boolean;
    defaultLanguage?: string;
    onHide: (ruid: string) => void;
    onUpdate: (updatedTonieCard: TonieCardProps) => void;
}> = ({ tonieCard, lastRUIDs, overlay, readOnly, defaultLanguage = "", onHide, onUpdate }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const [keyInfoModal, setKeyInfoModal] = useState(0);
    const [localTonieCard, setLocalTonieCard] = useState<TonieCardProps>(tonieCard);
    const [messageApi, contextHolder] = message.useMessage();
    const [isValid, setIsValid] = useState(localTonieCard.valid);
    const [isNoCloud, setIsNoCloud] = useState(localTonieCard.nocloud);
    const [isLive, setIsLive] = useState(localTonieCard.live);
    const [downloadTriggerUrl, setDownloadTriggerUrl] = useState(localTonieCard.downloadTriggerUrl);
    const { playAudio } = useAudioContext();
    const [isInformationModalOpen, setInformationModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSelectFileModalOpen, setSelectFileModalOpen] = useState(false);

    const [activeModel, setActiveModel] = useState(localTonieCard.tonieInfo.model);
    const [selectedModel, setSelectedModel] = useState("");

    const [activeSource, setActiveSource] = useState(localTonieCard.source);
    const [selectedSource, setSelectedSource] = useState("");

    const fetchUpdatedTonieCard = async () => {
        try {
            const updatedTonieCard = await api.apiGetTagInfo(localTonieCard.ruid, overlay);
            setLocalTonieCard(updatedTonieCard);
            onUpdate(updatedTonieCard);
        } catch (error) {
            message.error("Error fetching updated card: " + error);
        }
    };

    const handleFileSelectChange = (files: any[], path: string, special: string) => {
        if (files && files.length === 1) {
            const prefix = special === "library" ? "lib:/" : "content:/";
            const filePath = prefix + path + "/" + files[0].name;
            setSelectedSource(filePath);
        } else {
            setSelectedSource(activeSource);
        }
    };

    const showFileSelectModal = () => {
        setSelectFileModalOpen(true);
    };

    const handleCancelSelectFile = () => {
        setSelectedSource(activeSource);
        setSelectFileModalOpen(false);
    };

    const showModelModal = () => {
        setSelectedModel(activeModel);
        setSelectedSource(activeSource);

        setIsEditModalOpen(true);
    };
    const handleSaveChanges = async () => {
        setIsEditModalOpen(false);
        const promises = [];
        if (activeSource !== selectedSource) {
            promises.push(handleSourceSave());
        }
        if (activeModel !== selectedModel) {
            promises.push(handleModelSave());
        }
        await Promise.all(promises);
        fetchUpdatedTonieCard();
    };

    const handleLiveClick = async () => {
        const url =
            `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${localTonieCard.ruid}` +
            (overlay ? `?overlay=${overlay}` : "");
        try {
            const response = await fetch(url, {
                method: "POST",
                body: "live=" + !isLive,
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            setIsLive(!isLive);
            if (!isLive) {
                message.success(t("tonies.messages.liveEnabled"));
            } else {
                message.success(t("tonies.messages.liveDisabled"));
            }
            fetchUpdatedTonieCard();
        } catch (error) {
            message.error(t("tonies.messages.sourceCouldNotChangeLiveFlag") + error);
        }
    };

    const handleNoCloudClick = async () => {
        const url =
            `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${localTonieCard.ruid}` +
            (overlay ? `?overlay=${overlay}` : "");
        try {
            const response = await fetch(url, {
                method: "POST",
                body: "nocloud=" + !isNoCloud,
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            setLocalTonieCard({
                ...localTonieCard,
                nocloud: !isNoCloud,
            });
            setIsNoCloud(!isNoCloud);
            if (!isNoCloud) {
                message.success(t("tonies.messages.cloudAccessBlocked"));
            } else {
                message.success(t("tonies.messages.cloudAccessEnabled"));
            }
            fetchUpdatedTonieCard();
        } catch (error) {
            message.error(t("tonies.messages.sourceCouldNotChangeCloudFlag") + error);
        }
    };

    const handlePlayPauseClick = async () => {
        const url = process.env.REACT_APP_TEDDYCLOUD_API_URL + localTonieCard.audioUrl;
        playAudio(url, localTonieCard.sourceInfo ? localTonieCard.sourceInfo : localTonieCard.tonieInfo);
    };

    const handleBackgroundDownload = async () => {
        const url = process.env.REACT_APP_TEDDYCLOUD_API_URL + localTonieCard.downloadTriggerUrl;
        setDownloadTriggerUrl("");
        try {
            messageApi.open({
                type: "loading",
                content: t("tonies.messages.downloading"),
                duration: 0,
            });
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }

            // blob used that message is shown after download finished
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const blob = await response.blob();

            messageApi.destroy();
            messageApi.open({
                type: "success",
                content: t("tonies.messages.downloadedFile"),
            });
            setIsValid(true);
        } catch (error) {
            messageApi.destroy();
            messageApi.open({
                type: "error",
                content: t("tonies.messages.errorDuringDownload") + error,
            });
            setDownloadTriggerUrl(url);
        }
    };

    const handleModelSave = async () => {
        const url =
            `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${localTonieCard.ruid}` +
            (overlay ? `?overlay=${overlay}` : "");
        try {
            const response = await fetch(url, {
                method: "POST",
                body: "tonie_model=" + selectedModel,
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            setActiveModel(selectedModel);
            message.success(
                t("tonies.messages.setTonieToModelSuccessful", {
                    selectedModel: selectedModel ? selectedModel : t("tonies.messages.setToEmptyValue"),
                })
            );
        } catch (error) {
            message.error(t("tonies.messages.setTonieToModelFailed") + error);
        }
    };

    const handleSourceSave = async () => {
        const url =
            `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${localTonieCard.ruid}` +
            (overlay ? `?overlay=${overlay}` : "");
        try {
            const response = await fetch(url, {
                method: "POST",
                body: "source=" + selectedSource,
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            setActiveSource(selectedSource);
            selectedSource ? setIsValid(true) : setIsValid(false);
            message.success(
                t("tonies.messages.setTonieToSourceSuccessful", {
                    selectedSource: selectedSource ? selectedSource : t("tonies.messages.setToEmptyValue"),
                })
            );
        } catch (error) {
            message.error(t("tonies.messages.setTonieToSourceFailed") + error);
        }

        if (!isNoCloud) {
            handleNoCloudClick();
        }
    };

    const handleModelInputChange = (e: any) => {
        setSelectedModel(e.target.value);
    };
    const handleSourceInputChange = (e: any) => {
        setSelectedSource(e.target.value);
    };

    const toniePlayedOn = lastRUIDs
        .filter(([ruid]) => ruid === localTonieCard.ruid)
        .map(([, ruidTime, boxName]) => ({ ruidTime, boxName }));

    const title =
        `${localTonieCard.tonieInfo.series}` +
        (localTonieCard.tonieInfo.episode ? ` - ${localTonieCard.tonieInfo.episode}` : "");

    const searchModelResultChanged = (newValue: string) => {
        setSelectedModel(newValue);
    };

    const searchRadioResultChanged = (newValue: string) => {
        setSelectedSource(newValue);
    };

    const editModalTitel = (
        <>
            <h3 style={{ lineHeight: 0 }}>
                {t("tonies.editModal.title")}
                {localTonieCard.tonieInfo.model ? " (" + localTonieCard.tonieInfo.model + ")" : ""}
            </h3>
            {localTonieCard.tonieInfo.series ? <Text type="secondary">{title}</Text> : " "}
        </>
    );

    const editModalFooter = (
        <>
            <Button
                type="primary"
                onClick={handleSaveChanges}
                disabled={activeSource === selectedSource && activeModel === selectedModel}
            >
                <SaveFilled key="saveClick" /> {t("tonies.editModal.save")}
            </Button>
        </>
    );

    const editModal = (
        <Modal
            open={isEditModalOpen}
            onCancel={() => setIsEditModalOpen(false)}
            title={editModalTitel}
            footer={editModalFooter}
            width={700}
        >
            <Divider orientation="left" orientationMargin="0">
                {t("tonies.editModal.source")}
            </Divider>
            <div>
                <Input
                    value={selectedSource}
                    width="auto"
                    onChange={handleSourceInputChange}
                    addonBefore={<CloseOutlined onClick={() => setSelectedSource(activeSource)} />}
                    addonAfter={<FolderOpenOutlined onClick={() => showFileSelectModal()} />}
                />
                <RadioStreamSearch
                    placeholder={t("tonies.editModal.placeholderSearchForARadioStream")}
                    onChange={searchRadioResultChanged}
                />
            </div>
            <Divider orientation="left" orientationMargin="0">
                {t("tonies.editModal.model")}
            </Divider>
            <div>
                <p>
                    <Input
                        value={selectedModel}
                        width="auto"
                        onChange={handleModelInputChange}
                        addonBefore={<CloseOutlined onClick={() => setSelectedModel(activeModel)} />}
                    />
                </p>
                <TonieArticleSearch
                    placeholder={t("tonies.editModal.placeholderSearchForAModel")}
                    onChange={searchModelResultChanged}
                />
            </div>
        </Modal>
    );

    const selectFileModal = (
        <Modal
            title={t("tonies.selectFileModal.selectFile")}
            open={isSelectFileModalOpen}
            onOk={() => setSelectFileModalOpen(false)}
            onCancel={handleCancelSelectFile}
            width="auto"
        >
            <FileBrowser
                special="library"
                maxSelectedRows={1}
                trackUrl={false}
                onFileSelectChange={handleFileSelectChange}
            />
        </Modal>
    );

    const actions = readOnly
        ? [
              <InfoCircleOutlined
                  key="info"
                  onClick={() => {
                      setKeyInfoModal(keyInfoModal + 1);
                      setInformationModalOpen(true);
                  }}
              />,
              isValid ? (
                  <PlayCircleOutlined key="playpause" onClick={handlePlayPauseClick} />
              ) : (
                  <PlayCircleOutlined key="playpause" style={{ cursor: "default", color: token.colorTextDisabled }} />
              ),
              <CloudSyncOutlined
                  key="nocloud"
                  style={{ cursor: "default", color: isNoCloud ? "red" : token.colorTextDisabled }}
              />,
              <RetweetOutlined
                  key="live"
                  style={{ cursor: "default", color: isLive ? "red" : token.colorTextDisabled }}
              />,
          ]
        : [
              <InfoCircleOutlined
                  key="info"
                  onClick={() => {
                      setKeyInfoModal(keyInfoModal + 1);
                      setInformationModalOpen(true);
                  }}
              />,
              <EditOutlined key="edit" onClick={showModelModal} />,
              isValid ? (
                  <PlayCircleOutlined key="playpause" onClick={handlePlayPauseClick} />
              ) : downloadTriggerUrl && downloadTriggerUrl.length > 0 ? (
                  <DownloadOutlined key="download" onClick={handleBackgroundDownload} />
              ) : (
                  <PlayCircleOutlined key="playpause" style={{ cursor: "default", color: token.colorTextDisabled }} />
              ),
              <CloudSyncOutlined
                  key="nocloud"
                  style={{ color: isNoCloud ? "red" : token.colorTextDescription }}
                  onClick={handleNoCloudClick}
              />,
              <RetweetOutlined
                  key="live"
                  style={{ color: isLive ? "red" : token.colorTextDescription }}
                  onClick={handleLiveClick}
              />,
          ];

    return (
        <>
            {contextHolder}
            <Card
                hoverable={false}
                key={localTonieCard.ruid}
                size="small"
                style={
                    toniePlayedOn && toniePlayedOn.length > 0
                        ? { background: token.colorBgContainerDisabled, borderTop: "3px #1677ff inset" }
                        : { background: token.colorBgContainerDisabled, paddingTop: "2px" }
                }
                title={
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {localTonieCard.tonieInfo.series ? localTonieCard.tonieInfo.series : t("tonies.unsetTonie")}
                        </div>
                        {defaultLanguage !== localTonieCard.tonieInfo.language ? (
                            <Tooltip
                                placement="top"
                                zIndex={2}
                                title={t("languageUtil." + localTonieCard.tonieInfo.language)}
                            >
                                <Text style={{ height: 20, width: "auto" }}>
                                    <LanguageFlagSVG countryCode={localTonieCard.tonieInfo.language} height={20} />
                                </Text>
                            </Tooltip>
                        ) : (
                            ""
                        )}
                    </div>
                }
                cover={
                    <div style={{ position: "relative" }}>
                        <img
                            alt={`${localTonieCard.tonieInfo.series} - ${localTonieCard.tonieInfo.episode}`}
                            src={localTonieCard.tonieInfo.picture}
                            style={
                                localTonieCard.tonieInfo.picture.includes("unknown")
                                    ? { padding: 8, paddingTop: 10, width: "100%" }
                                    : { padding: 8, width: "100%" }
                            }
                        />
                        {"sourceInfo" in localTonieCard &&
                        localTonieCard.sourceInfo.picture !== localTonieCard.tonieInfo.picture ? (
                            <Tooltip
                                title={t("tonies.alternativeSource", {
                                    originalTonie: title,
                                    assignedContent:
                                        localTonieCard.sourceInfo.series +
                                        (localTonieCard.sourceInfo.episode
                                            ? " - " + localTonieCard.sourceInfo.episode
                                            : ""),
                                })}
                                placement="bottom"
                            >
                                <img
                                    src={localTonieCard.sourceInfo.picture}
                                    alt=""
                                    style={{
                                        bottom: 0,
                                        padding: 8,
                                        position: "absolute",
                                        right: 20,
                                        height: "50%",
                                        width: "auto",
                                    }}
                                />
                            </Tooltip>
                        ) : (
                            ""
                        )}
                    </div>
                }
                actions={actions}
            >
                <Meta title={`${localTonieCard.tonieInfo.episode}`} description={localTonieCard.uid} />
            </Card>
            <TonieInformationModal
                isOpen={isInformationModalOpen}
                onClose={() => setInformationModalOpen(false)}
                tonieCardOrTAFRecord={localTonieCard}
                readOnly={readOnly}
                lastRUIDs={lastRUIDs}
                onHide={onHide}
                overlay={overlay}
                key={keyInfoModal}
            />
            {selectFileModal}
            {editModal}
        </>
    );
};
