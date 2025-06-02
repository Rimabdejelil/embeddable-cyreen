import React, { useEffect, useState } from 'react';
import Title from '../../Title';
import Description from '../../Description';
import { translateText } from '../../translateText';

// Import the image at the top of your file
import SummaryIcon from '../../../../assets/Summary.png';
import TimesplitIcon from '../../../../assets/Timesplit.png';
import ImpressionsIcon from '../../../../assets/Impressions by store.png';
import ComparisonIcon from '../../../../assets/Comparison.png';
import BasketsizeIcon from '../../../../assets/Basket Size.png';
import ConversionrateIcon from '../../../../assets/Conversion Rate.png';
import UpliftIcon from '../../../../assets/Uplift.png';
import WeekdayIcon from '../../../../assets/Weekday.png';
import StoresIcon from '../../../../assets/Stores.png';
import AllKPIsIcon from '../../../../assets/All KPIs.png';
import Impressions from '../../../../assets/Round Impressions.png';
import StoreComparison from '../../../../assets/Store Comparison.png';
import ShopperDuration from '../../../../assets/ShopperDuration.png';

const iconMap: { [key: string]: string } = {
  summary: SummaryIcon,
  timesplit: TimesplitIcon,
  'impressions by store': ImpressionsIcon,
  comparison: ComparisonIcon,
  'basket size': BasketsizeIcon,
  uplift: UpliftIcon,
  'conversion rate': ConversionrateIcon,
  weekday: WeekdayIcon,
  stores: StoresIcon,
  allkpis: AllKPIsIcon,
  impressions: Impressions,
  storecomparison: StoreComparison,
  shopperduration: ShopperDuration
};

type Props = {
  title?: string;
  body?: string;
  titleFontSize?: number;
  bodyFontSize?: number;
  clientContext?: {
    language?: string;
  };
  icon?: string;
  granularity?: string;
};

const AutoTranslateText = (props: Props) => {
  const {
    title = 'Default Title',
    body = 'Default body text',
    titleFontSize,
    bodyFontSize,
    clientContext,
    icon,
    granularity
  } = props;

  const [translatedTitle, setTranslatedTitle] = useState(title);
  const [translatedBody, setTranslatedBody] = useState(body);

  useEffect(() => {
    const translate = async () => {
      if (clientContext?.language) {
        const tTitle = await translateText(title, clientContext.language);
        const tBody = await translateText(body, clientContext.language);
        setTranslatedTitle(tTitle);
        setTranslatedBody(tBody);
      }
    };

    translate();
  }, [title, body, clientContext]);

  // Function to get granularity text
  const getGranularityText = () => {
    if (!granularity) return '';
    switch (granularity.toLowerCase()) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      default: return '';
    }
  };

  const granularityText = getGranularityText();

  const containerStyle = {
    backgroundColor: '#62626e',
    padding: '20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    height: '80px',
  };

  const titleStyle = {
    fontSize: titleFontSize ? `${titleFontSize}px` : 'inherit',
    lineHeight: titleFontSize ? '1.2em' : 'inherit',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '10px',
  };

  const bodyStyle = {
    fontSize: bodyFontSize ? `${bodyFontSize}px` : 'inherit',
    lineHeight: bodyFontSize ? '1.2em' : 'inherit',
    fontWeight: 'bold',
    color: 'white',
    marginTop: '0',
  };

  const iconUrl = icon ? iconMap[icon.toLowerCase()] : null;

  const iconStyle = {
    width: '69px',
    height: '69px',
    marginRight: '10px',
    marginLeft: '0px',
  };

  const bodyContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  };

  // Combine body and granularity text if granularity exists
  const descriptionText = granularityText
    ? `${translatedBody} ${granularityText}`
    : translatedBody;

  return (
    <div style={containerStyle}>
      {iconUrl && <img src={iconUrl} alt="Selected Icon" style={iconStyle} />}
      <div style={bodyContainerStyle}>
        <Title title={translatedTitle} style={titleStyle} />
        <Description description={descriptionText} style={bodyStyle} />
      </div>
    </div>
  );
};

export default AutoTranslateText;