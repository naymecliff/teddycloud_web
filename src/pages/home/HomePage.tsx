import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Typography, Button } from 'antd';
import { TonieCardProps } from '../../components/tonies/TonieCard'; // Import the TonieCard component and its props type
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";
import { ToniesList } from '../../components/tonies/ToniesListDisplayOnly';

import {
  HiddenDesktop,
  StyledBreadcrumb,
  StyledBreadcrumbItem,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph } = Typography;

export const HomePage = () => {
  const { t } = useTranslation();

  // Define the state with TonieCardProps[] type
  const [tonies, setTonies] = useState<TonieCardProps[]>([]);

  useEffect(() => {
    const fetchTonies = async () => {
      // Perform API call to fetch Tonie data
      const tonieData = await api.apiGetTagIndex();
      setTonies(tonieData.sort((a, b) => {
        if (a.tonieInfo.series < b.tonieInfo.series) {
          return -1;
        }
        if (a.tonieInfo.series > b.tonieInfo.series) {
          return 1;
        }
        if (a.tonieInfo.episode < b.tonieInfo.episode) {
          return -1;
        }
        if (a.tonieInfo.episode > b.tonieInfo.episode) {
          return 1;
        }
        return 0;
      }));
    };

    fetchTonies();
  }, []);

  return (
    <>
      <StyledSider>
        <HomeSubNav />
      </StyledSider>
      <StyledLayout>
        <HiddenDesktop>
          <HomeSubNav />
        </HiddenDesktop>
        <StyledBreadcrumb items={[{ title: t("home.navigationTitle") }]} />
        <StyledContent>
          <h1>{t(`home.title`)}</h1>
          <Paragraph>
            {t(`home.intro`)}
          </Paragraph>
          <Paragraph>
            {t("home.forumIntroPart1")}<Link to ="https://forum.revvox.de/" target="_blank">https://forum.revvox.de/</Link>{t("home.forumIntroPart2")}
          </Paragraph>
          <Paragraph>
            <h2>{t("home.yourTonies")}</h2>
            <ToniesList tonieCards={tonies.filter(tonie => tonie.type === 'tag' && tonie.tonieInfo.series && !tonie.nocloud ).slice(0, 5)} />
            <Button><Link to="/tonies">{t("home.toAllYourTonies")}</Link></Button>
          </Paragraph>
          <Paragraph>
            <h2>{t("home.helpfulLinks")}</h2>
            <ul>
                <li><Link to="https://github.com/toniebox-reverse-engineering" target="_blank">GitHub</Link></li>
                <li><Link to="https://t.me/toniebox_reverse_engineering" target="_blank">Telegram Chat</Link></li>
                <li><Link to="https://forum.revvox.de/" target="_blank">Discourse Forum</Link></li>
            </ul>
          </Paragraph>
        </StyledContent>
      </StyledLayout>
    </>
  );
};