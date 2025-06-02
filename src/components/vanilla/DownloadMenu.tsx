import { DataResponse } from '@embeddable.com/core';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import IconDownloadCSV from '../icons/DownloadCSV';
import IconDownloadPNG from '../icons/DownloadPNG';
import IconVerticalEllipsis from '../icons/VerticalEllipsis';
import downloadAsCSV from '../util/downloadAsCSV';
import IconEye from '../icons/Eye';
import IcoEyeOff from '../icons/EyeOff';

import downloadAsPNG from '../util/downloadAsPNG';
import { ContainerProps } from './Container';
import IconEyeOff from '../icons/EyeOff';

interface CSVProps extends ContainerProps {
  results?: DataResponse | DataResponse[];
  prevResults?: DataResponse;
}

type Props = {
  csvOpts?: {
    chartName: string;
    props: CSVProps;
  };
  enableDownloadAsCSV?: boolean;
  enableDownloadAsPNG?: boolean;
  pngOpts?: {
    chartName: string;
    element: HTMLDivElement | null;
  };
  preppingDownload: boolean;
  setPreppingDownload: Dispatch<SetStateAction<boolean>>;
  showLabels?: boolean;
  onToggleLabels?: (show: boolean) => void;
};

const DownloadMenu: React.FC<Props> = (props) => {
  const {
    csvOpts,
    enableDownloadAsCSV,
    enableDownloadAsPNG,
    pngOpts,
    preppingDownload,
    setPreppingDownload,
    showLabels,
    onToggleLabels
  } = props;
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isDownloadStarted, setIsDownloadStarted] = useState<boolean>(false);
  const refFocus = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDownloadStarted && preppingDownload) {
      if (!pngOpts) {
        console.error('No PNG options supplied');
        return;
      }
      const { chartName, element } = pngOpts;
      if (element) {
        const cleanedChartName = chartName.replace(/([^a-zA-Z0-9 ]+)/gi, '-');
        const timestamp = new Date().toISOString();
        setTimeout(() => {
          downloadAsPNG(element, `${cleanedChartName}-${timestamp}.png`, setPreppingDownload);
        }, 200);
      }
      setIsDownloadStarted(false);
    }
  }, [isDownloadStarted, pngOpts, preppingDownload, setPreppingDownload]);

  const handleCSVClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (!csvOpts) {
      console.error('No CSV options supplied');
      return;
    }
    const { chartName, props: csvProps } = csvOpts;
    let data: DataResponse['data'] = [];
    if (Array.isArray(csvProps.results)) {
      data = csvProps.results.reduce((acc: DataResponse['data'] = [], result) => {
        if (result?.data) {
          acc.push(...result.data);
        }
        return acc;
      }, []);
    } else {
      data = csvProps.results?.data;
    }
    downloadAsCSV(csvProps, data, csvProps.prevResults?.data, chartName, setPreppingDownload);
  };

  useEffect(() => {
    if (showMenu) {
      refFocus.current?.focus();
    }
  }, [showMenu]);

  const handlePNGClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setShowMenu(false);
    setPreppingDownload(true);
    setIsDownloadStarted(true);
  };

  const handleToggleLabels = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();  // Add this to prevent event bubbling
    if (onToggleLabels) {
      onToggleLabels(!showLabels);
    }
    setShowMenu(false);
  };

  const handleSetShow = () => {
    setShowMenu(!showMenu);
  };

  if (!enableDownloadAsCSV && !enableDownloadAsPNG) {
    return null;
  }

  if (enableDownloadAsCSV && !enableDownloadAsPNG) {
    return (
      <div className="absolute top-0 right-0 z-5 flex items-center justify-end space-x-2">
        <div onClick={handleCSVClick} className="cursor-pointer">
          {!preppingDownload && (
            <IconDownloadCSV className="cursor-pointer hover:opacity-100 opacity-50" />
          )}
        </div>
      </div>
    );
  }

  if (!enableDownloadAsCSV && enableDownloadAsPNG) {
    return (
      <div className="absolute top-0 right-0 z-5 flex items-center justify-end space-x-2">
        <div onClick={handlePNGClick} className="cursor-pointer">
          {!preppingDownload && (
            <IconDownloadPNG className="cursor-pointer hover:opacity-100 opacity-50" />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-0 right-0 z-5 flex items-center justify-end space-x-2">
        <div onClick={handleSetShow} className="cursor-pointer relative w-3 flex justify-center">
          {!preppingDownload && (
            <IconVerticalEllipsis className="cursor-pointer hover:opacity-100 opacity-50" />
          )}
          {showMenu && (
            <>
              <div className="absolute bg-white flex items-center right-0 p-4 rounded shadow-md top-6 w-40 whitespace-nowrap">
                <ul className="w-full space-y-2"> {/* Added space-y-2 for consistent spacing */}
                  <li>
                    <a
                      href="#"
                      onClick={handleCSVClick}
                      className="flex items-center gap-2 hover:opacity-100 opacity-60 w-full"
                    >
                      <IconDownloadCSV className="flex-shrink-0 w-4 h-4" /> {/* Fixed size */}
                      <span>Download CSV</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      onClick={handlePNGClick}
                      className="flex items-center gap-2 hover:opacity-100 opacity-60 w-full"
                    >
                      <IconDownloadPNG className="flex-shrink-0 w-4 h-4" /> {/* Fixed size */}
                      <span>Download PNG</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      onMouseDown={handleToggleLabels}
                      className="flex items-center gap-2 hover:opacity-100 opacity-60 w-full"
                    >
                      {showLabels ? (
                        <>
                          <IconEyeOff className="flex-shrink-0 w-4 h-4" /> {/* Fixed size */}
                          <span>Hide Labels</span>
                        </>
                      ) : (
                        <>
                          <IconEye className="flex-shrink-0 w-4 h-4" /> {/* Fixed size */}
                          <span>Show Labels</span>
                        </>
                      )}
                    </a>
                  </li>
                </ul>
              </div>
              <input
                type="text"
                ref={refFocus}
                onBlur={() =>
                  setTimeout(() => {
                    setShowMenu(false);
                  }, 200)
                }
                style={{ width: 1, height: 1, opacity: 0 }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DownloadMenu;