import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { isBrowser } from "react-device-detect";
import QRCode from "react-qr-code";
import { Tooltip } from "@material-tailwind/react";

import components from "components";
import {
  formatHash,
  formatHexToInt,
  numToFixed,
  WEIToFTM,
  isObjectEmpty,
  getTypeByStr,
  addressToDomain,
} from "utils";
import moment from "moment";
import services from "services";
import clients from "clients";

import ERC1155TransactionList from "./ERC1155TransactionList";
import ERC20TransactionList from "./ERC20TransactionList";
import ERC721TransactionList from "./ERC721TransactionList";

const GET_BLOCK = gql`
  query AccountByAddress($address: Address!, $cursor: Cursor, $count: Int!) {
    account(address: $address) {
      address
      contract {
        address
        deployedBy {
          hash
          contractAddress
        }
        name
        version
        compiler
        sourceCode
        abi
        validated
        supportContact
        timestamp
      }
      balance
      totalValue
      txCount
      txList(cursor: $cursor, count: $count) {
        pageInfo {
          first
          last
          hasNext
          hasPrevious
        }
        totalCount
        edges {
          cursor
          transaction {
            hash
            from
            to
            value
            gasUsed
            block {
              number
              timestamp
            }
            tokenTransactions {
              trxIndex
              tokenAddress
              tokenName
              tokenSymbol
              tokenType
              tokenId
              tokenDecimals
              type
              sender
              recipient
              amount
            }
          }
        }
      }
      staker {
        id
        createdTime
        isActive
      }
      delegations {
        totalCount
        edges {
          delegation {
            toStakerId
            createdTime
            amount
            claimedReward
            pendingRewards {
              amount
            }
          }
          cursor
        }
      }
    }
  }
`;

const columns = [
  {
    name: "Txn Hash",
    selector: (row) => row.transaction.hash,
    cell: (row) => (
      <Link
        className="text-blue-500 dark:text-gray-300"
        to={`/tx/${row.transaction.hash}`}
      >
        {" "}
        {formatHash(row.transaction.hash)}
      </Link>
    ),
    sortable: true,
    grow: 1,
  },
  {
    name: "Block",
    selector: (row) => row.transaction.block.number,
    cell: (row) => (
      <Link
        to={`/block/${formatHexToInt(row.transaction.block.number)}`}
        className="text-blue-500 dark:text-gray-300"
      >
        #{formatHexToInt(row.transaction.block.number)}
      </Link>
    ),
    maxWidth: "50px",
  },
  {
    name: "Time",
    selector: (row) => row.transaction.block.timestamp,
    cell: (row) => (
      <span className="text-black dark:text-gray-300">
        {moment.unix(row.transaction.block.timestamp).fromNow()}
      </span>
    ),
  },
  {
    name: "From",
    selector: (row) => row.transaction.from,
    cell: (row) => (
      <Link
        className="flex flex-row items-center justify-between gap-4 text-blue-500 dark:text-gray-300"
        to={`/address/${row.transaction.from}`}
      >
        {" "}
        {formatHash(row.transaction.from)}
        <img
          src={services.linking.static("images/arrow-right.svg")}
          alt="from"
          srcSet=""
          className="w-4"
        />
      </Link>
    ),
    sortable: true,
  },
  {
    name: "T0",
    selector: (row) => row.transaction.to,
    cell: (row) => (
      <Link
        className="text-blue-500 dark:text-gray-300"
        to={`/address/${row.transaction.to}`}
      >
        {" "}
        {formatHash(row.transaction.to)}
      </Link>
    ),
    sortable: true,
  },
  {
    name: "Value",
    selector: (row) => row.transaction.value,
    cell: (row) => (
      <span className="text-black dark:text-gray-300">
        {numToFixed(WEIToFTM(row.transaction.value), 2)} FTM
      </span>
    ),
    sortable: true,
    maxWidth: "250px",
  },
  {
    name: "Txn Fee",
    selector: (row) => row.transaction.gasUsed,
    cell: (row) => (
      <span className="text-sm text-black dark:text-gray-300">
        {formatHexToInt(row.transaction.gasUsed)}
      </span>
    ),
    sortable: true,
    maxWidth: "130px",
  },
];
export default function Address() {
  const params = useParams();

  const [transaction, setTransaction] = useState([]);
  const [address, setAddress] = useState("");

  const [erc20Count, setERC20Count] = useState("0x0");
  const [erc721Count, setERC721Count] = useState("0x0");
  const [erc1155Count, setERC1155Count] = useState("0x0");

  const [ftmPrice, setFtmPrice] = useState("");

  const [copied, setCopied] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [totalCount, setTotalCount] = useState("0x0");
  const [perPage, setPerPage] = useState(25);
  const [pageInfo, setPageInfo] = useState(25);

  const { loading, error, data, fetchMore } = useQuery(GET_BLOCK, {
    variables: {
      address: params.id,
      cursor: null,
      count: perPage,
    },
  });

  useEffect(() => {
    const calculateFtmValue = async (_ftmBalance) => {
      const api = services.provider.buildAPI();
      const rate = await api.getFTMConversionRateFromChainlink(
        "0xf4766552D15AE4d256Ad41B6cf2933482B0680dc"
      );
      const price =
        (rate / Math.pow(10, 8)) *
        WEIToFTM(formatHexToInt(transaction.balance));
      setFtmPrice(price);
    };
    calculateFtmValue(WEIToFTM(formatHexToInt(transaction.balance)));
  }, [transaction.balance]);

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    }
  }, [copied]);

  useEffect(async () => {
    if (data) {
      const account = data.account;
      let address = await addressToDomain(account.address);
      setAddress(address);
      setPerPage(25);
      setTransaction(account);
      setTotalCount(account.txCount);
      setPageInfo(account.txList.pageInfo);
      await formatDomain(account);
    }
  }, [loading]);

  const updateQuery = async (previousResult, { fetchMoreResult }) => {
    if (!fetchMoreResult) {
      return previousResult;
    }
    setTransaction(fetchMoreResult.account);

    await formatDomain(fetchMoreResult.account);
    return { ...fetchMoreResult };
  };

  const fetchMoreData = (cursor, size = perPage) => {
    if (data && fetchMore) {
      fetchMore({ updateQuery, variables: { cursor: cursor, count: size } });
    }
  };
  const formatDomain = async (data) => {
    let newAddressData = [];
    let formatedData = [];

    for (let i = 0; i < data.txList.edges.length; i++) {
      let edgeNew;

      const addressFrom = await addressToDomain(
        data.txList.edges[i].transaction.from
      );
      const addressTo = await addressToDomain(
        data.txList.edges[i].transaction.to
      );
      edgeNew = {
        ...data.txList.edges[i],
        transaction: {
          ...data.txList.edges[i].transaction,
          from: addressFrom,
          to: addressTo,
          block: {
            ...data.txList.edges[i].transaction.block,
          },
          tokenTransactions: {
            ...data.txList.edges[i].transaction.tokenTransactions,
          },
        },
      };
      formatedData.push(edgeNew);
    }
    newAddressData = {
      ...data,
      txList: {
        pageInfo: {
          ...data.txList.pageInfo,
        },
        ...data.txList,
        edges: [...formatedData],
      },
    };
    setTransaction(newAddressData);
  };
  return (
    <div className="w-screen max-w-6xl">
      <div className="flex items-center text-black dark:text-gray-100 md:text-xl sm:text-xl text-sm  px-2 font-normal py-3 bg-gray-100 dark:bg-[#2c2e3f]">
        <QRCode value={params.id} size={20} />{" "}
        <span className="mx-3"> Address </span>
        <span className="font-bold">{isBrowser? address: formatHash(address)}</span>
        <Tooltip content="Copy Address to clipboard">
          <button
            onClick={() => {
              setCopied(true);
              navigator.clipboard.writeText(params.id);
            }}
          >
            <img
              src={services.linking.static("images/copy.svg")}
              className="mx-2 inline h-3 md:h-4 m-auto dark:md:h-4"
              data-tooltip-target="tooltip-default"
              alt="Copy"
            />
          </button>
        </Tooltip>
        {copied ? (
          <span className="text-black text-sm font-bold bg-gray-100">
            Copied!
          </span>
        ) : (
          ""
        )}
      </div>

      <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
        <div className="flex flex-col py-2 my-2 justify-center items-center  bg-gray-100 dark:bg-[#2c2e3f]">
          <QRCode value={params.id} size={200} />{" "}
        </div>
        <components.DynamicTable
          title={`Overview`}
          dontNeedSubtitle={true}
          classes="col-span-2 w-full"
        >
          {loading ? (
            <tr>
              <td>
                <components.Loading />
              </td>
            </tr>
          ) : (
            <>
              <tr>
                <td className="flex justify-between border-b  dark:border-gray-700  p-3">
                  <div className="text-sm ml-1 ml-sm-0 text-nowrap">
                    Address:
                  </div>
                  <div className="col-span-2 font-semibold">{isBrowser? params.id: formatHash(params.id)}</div>
                </td>
              </tr>
              <tr>
                <td className="flex justify-between border-b  dark:border-gray-700  p-3">
                  <div className="text-sm ml-1 ml-sm-0 text-nowrap">
                    Domain Name:
                  </div>
                  <div className="col-span-2 font-semibold break-words">
                    {getTypeByStr(address) === "address"
                      ? "Not Registered"
                      : address}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="flex justify-between border-b  dark:border-gray-700  p-3">
                  <div className="text-sm ml-1 ml-sm-0 text-nowrap">
                    Balance:
                  </div>
                  <div className="col-span-2 break-words gap-2">
                    <span className="font-semibold">
                      {WEIToFTM(formatHexToInt(transaction.balance))}
                    </span>{" "}
                    <span>FTM</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="flex justify-between border-b md:p-3 p-3">
                  <div className="text-sm ml-1 ml-sm-0 text-nowrap">
                    FTM Value:
                  </div>
                  <div className="font-semibold">
                    {numToFixed(ftmPrice, 2)} $
                  </div>
                </td>
              </tr>
            </>
          )}
        </components.DynamicTable>
      </div>

      <div className="bg-gray-100 dark:bg-[#2c2e3f] text-gray-600 p-2">
        <div className="flex space-x-3 border-b">
          {/* Loop through tab data and render button for each. */}
          <button
            className={`p-2 border-b-4 transition-colors duration-300 dark:text-gray-100 ${
              0 === activeTabIndex
                ? "border-teal-500"
                : "border-transparent hover:border-gray-200"
            }`}
            // Change the active tab on click.
            onClick={() => setActiveTabIndex(0)}
          >
            Transactions {`(${formatHexToInt(data?.account?.txCount)})`}
          </button>
          <button
            className={`p-2 border-b-4 transition-colors duration-300 dark:text-gray-100 ${
              1 === activeTabIndex
                ? "border-teal-500"
                : "border-transparent hover:border-gray-200"
            }`}
            // Change the active tab on click.
            onClick={() => setActiveTabIndex(1)}
          >
            ERC-20 Token Txns {`( ${formatHexToInt(erc20Count)} )`}
          </button>
          <button
            className={`p-2 border-b-4 transition-colors duration-300 dark:text-gray-100 ${
              2 === activeTabIndex
                ? "border-teal-500"
                : "border-transparent hover:border-gray-200"
            }`}
            // Change the active tab on click.
            onClick={() => setActiveTabIndex(2)}
          >
            ERC-721 Token Txns {`( ${formatHexToInt(erc721Count)} )`}
          </button>
          <button
            className={`p-2 border-b-4 transition-colors duration-300 dark:text-gray-100 ${
              3 === activeTabIndex
                ? "border-teal-500"
                : "border-transparent hover:border-gray-200"
            }`}
            // Change the active tab on click.
            onClick={() => setActiveTabIndex(3)}
          >
            ERC-1155 Token Txns {`( ${formatHexToInt(erc1155Count)} )`}
          </button>
        </div>
        {/* Show active tab content. */}
        <div className="py-4">
          <div
            className={transaction && activeTabIndex === 0 ? "block" : "hidden"}
          >
            <components.TableView
              classes="w-screen max-w-6xl"
              title="Transactions"
              columns={columns}
              loading={loading}
              data={transaction.txList?.edges}
              isCustomPagination={true}
              pageInfo={pageInfo}
              totalCount={totalCount}
              fetchMoreData={fetchMoreData}
            />
          </div>
          <div
            className={transaction && activeTabIndex === 1 ? "block" : "hidden"}
          >
            <ERC20TransactionList
              address={params.id}
              setTotal={setERC20Count}
            />
          </div>
          <div
            className={transaction && activeTabIndex === 2 ? "block" : "hidden"}
          >
            <ERC721TransactionList
              address={params.id}
              setTotal={setERC721Count}
            />
          </div>
          <div
            className={transaction && activeTabIndex === 3 ? "block" : "hidden"}
          >
            <ERC1155TransactionList
              address={params.id}
              setTotal={setERC1155Count}
            />
          </div>
        </div>
      </div>
    </div>
  );
}