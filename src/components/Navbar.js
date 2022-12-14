import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/solid";
import { isBrowser } from "react-device-detect";
import services from "services";
import components from "components";
import { numToFixed, getTypeByStr, formatDomainName } from "utils";

export default function Navbar(props) {
  const [isNavOpen, setIsNavOpen] = useState(false); // initiate isNavOpen state with false
  const [price, setPrice] = useState(0);
  const [keywordType, setKeywordType] = useState("all");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const getFTMPrice = async () => {
      fetch(
        "https://api.ftmscan.com/api?module=stats&action=ftmprice&apikey=B7S69ATJVVHDE6NIQC74D9VD3R16NKZSMP"
      )
        .then(res => res.json())
        .then(data => {
          if (data.status === "1") setPrice(data.result.ethusd);
        });
    };
    getFTMPrice();
  }, []);

  const handleChange = _keyword => {
    const type = getTypeByStr(_keyword);
    console.log(type);
    switch (type) {
      case "transaction_hash":
        location.href = "/tx/" + _keyword;
        break;
      case "address":
        location.href = "/address/" + _keyword;
        break;
      case "block":
        location.href = "/block/" + _keyword;
        break;
      case "domain":
        location.href = "/domain/" + formatDomainName(_keyword);
        break;
      default:
        break;
    }
  };
  const onClickSearch = () => {
    const type = getTypeByStr(keyword);
    switch (type) {
      case "transaction_hash":
        location.href = "/tx/" + keyword;
        break;
      case "address":
        location.href = "/address/" + keyword;
        break;
      case "block":
        location.href = "/block/" + keyword;
        break;
      case "domain":
        location.href = "/domain/" + formatDomainName(keyword);
        break;
      default:
        break;
    }
  };
  return (
    <header
      className="sticky top-0 z-30 w-full bg-gray-100 dark:text-gray-300 text-gray-200 px-2 py-4 bg-gray-100 sm:px-4"
      style={{
        backgroundImage: `url(${props.isDarkmode
          ? services.linking.static("images/navbar-bg-dark.png")
          : services.linking.static("images/navbar-bg.png")})`,
        backgroundSize: "cover"
      }}
    >
      <div className="flex items-center justify-between mx-auto max-w-6xl">
        <div className="flex flex-row items-center justify-center gap-2">
          <Link
            to="/"
            className="flex flex-row items-center justify-center gap-2"
          >
            <img
              src={services.linking.static("images/fantom-ftm-logo.png")}
              className="h-10 md:h-10 m-auto dark:md:h-10"
              alt="FNS Domains"
            />{" "}
            <span className="font-bold text-lg">FTMBlocks</span>
          </Link>
          <div className="text-white text-sm">
            <span className="font-bold">FTM:</span> {numToFixed(price, 4)} $
          </div>
        </div>

        <div className="flex justify-end items-center space-x-1">
          <ul className="hidden  space-x-1 md:inline-flex">
            <li>
              <Link
                className="block px-2 w-full text-lg flex items-center justify-between"
                to="/"
              >
                <div>Home</div>
              </Link>
            </li>
            <li>
              <Link
                className="block px-2 w-full text-lg flex items-center justify-between"
                to="/blocks"
              >
                <div>Blocks</div>
              </Link>
            </li>
            <li>
              <Link
                className="block px-2 w-full text-lg flex items-center justify-between"
                to="/transactions"
              >
                <div>Transactions</div>
              </Link>
            </li>
            <li>
              <Link
                className="block px-2 w-full text-lg flex items-center justify-between"
                to="/epochs"
              >
                <div>Epochs</div>
              </Link>
            </li>
            <li>
              <Link
                className="block px-2 w-full text-lg flex items-center justify-between"
                to="/staking"
              >
                <div>Staking</div>
              </Link>
            </li>
            <li>
              <Link
                className="block px-2 w-full text-lg flex items-center justify-between"
                to="/assets"
              >
                <div>Assets</div>
              </Link>
            </li>
            <li>
              <Link
                className="block px-2 w-full text-lg flex items-center justify-between"
                to="/contracts"
              >
                <div>Contracts</div>
              </Link>
            </li>
          </ul>
          <div className="inline-flex md:hidden">
            <button
              className="flex-none px-2 "
              onClick={() => setIsNavOpen(prev => !prev)}
            >
              {!isNavOpen
                ? <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                : <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>}

              <span className="sr-only">Open Menu</span>
            </button>
          </div>
        </div>
      </div>
      {isBrowser && window.location.pathname !== "/"
        ? ""
        : <div className="flex items-center justify-center mx-auto max-w-6xl mt-2">
            <div className="flex md:w-3/5 lg:w-5/7 sm:w-7/9 w-11/12">
              <div className="flex-none bg-gray-100 dark:bg-[#2c2e3f] p-0.5 rounded-l border  border-gray-300">
                <select
                  id="countries"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 dark:bg-[#2c2e3f] dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  onChange={e => setKeywordType(e.target.value)}
                  value={keywordType}
                >
                  <option value="all">All</option>
                  <option value="block">Block</option>
                  <option value="txhash">Tx Hash</option>
                  <option value="address">Address</option>
                  <option value="token">Token</option>
                  <option value="domain">Domain</option>
                </select>
              </div>
              <components.Input
                type="text"
                id="voice-search"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:ring-gray-500 focus:border-gray-500 block pl-2 p-3"
                placeholder="Search by Address / Tx Hash / Block / Name"
                handleChange={handleChange}
                value={keyword}
                onInputChange={e => setKeyword(e.target.value)}
                required={false}
              />
              <button
                className="bg-[#0713ff] dark:bg-[#2c2e3f] text-gray-100 hover:bg-gray-800 px-5 md:text-lg sm:text-md text-black dark:text-gray-100 rounded-r hidden sm:hidden md:hidden lg:block border  border-gray-300"
                onClick={onClickSearch}
              >
                Search
              </button>
            </div>
          </div>}

      <div
        className={`${isNavOpen
          ? ""
          : "hidden"}  bg-gray-100  dark:bg-[#2c2e3f] dark:text-gray-300 text-black left-0 mt-5 w-full z-10 transition-all`}
        style={{
          left: "100%",
          transform: !isNavOpen ? "translateX(-100%)" : "translateX(0)"
        }}
      >
        <ul className="flex flex-col items-center justify-between p-2">
          <li className="w-full px-2">
            <Link
              className="block text-lg p-2 w-full flex items-center justify-between"
              to="/"
            >
              <div>Home</div>
              <ArrowRightIcon className="w-6" />
            </Link>
          </li>
          <li className="w-full px-2">
            <Link
              className="block text-lg p-2 w-full flex items-center justify-between"
              to="/blocks"
            >
              <div>Blocks</div>
              <ArrowRightIcon className="w-6" />
            </Link>{" "}
          </li>
          <li className="w-full px-2">
            <Link
              className="block text-lg p-2 w-full flex items-center justify-between"
              to="/transactions"
            >
              <div>Transactions</div>
              <ArrowRightIcon className="w-6" />
            </Link>{" "}
          </li>
          <li className="w-full px-2">
            <Link
              className="block text-lg p-2 w-full flex items-center justify-between"
              to="/epochs"
            >
              <div>Epochs</div>
              <ArrowRightIcon className="w-6" />
            </Link>{" "}
          </li>
          <li className="w-full px-2">
            <Link
              className="block text-lg p-2 w-full flex items-center justify-between"
              to="/staking"
            >
              <div>Staking</div>
              <ArrowRightIcon className="w-6" />
            </Link>{" "}
          </li>
          <li className="w-full px-2">
            <Link
              className="block text-lg p-2 w-full flex items-center justify-between"
              to="/assets"
            >
              <div>Assets</div>
              <ArrowRightIcon className="w-6" />
            </Link>{" "}
          </li>
          <li className="w-full px-2">
            <Link
              className="block text-lg p-2 w-full flex items-center justify-between"
              to="/contracts"
            >
              <div>Contracts</div>
              <ArrowRightIcon className="w-6" />
            </Link>{" "}
          </li>
        </ul>
      </div>
    </header>
  );
}
