import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

import { useQuery, gql } from "@apollo/client";
import components from "components";
import { Link } from "react-router-dom";
import {
  formatHash,
  formatHexToInt,
  numToFixed,
  WEIToFTM,
  isObjectEmpty,
} from "utils";
import moment from "moment";
import services from "services";

const GET_ERC20TRANSACTIONS = gql`
  query GetERC721Transactions(
    $address: Address!
    $cursor: Cursor
    $count: Int!
  ) {
    account(address: $address) {
      address
      erc721TxList(cursor: $cursor, count: $count) {
        pageInfo {
          first
          last
          hasNext
          hasPrevious
        }
        totalCount
        edges {
          cursor
          trx {
            trxHash
            sender
            recipient
            amount
            timeStamp
            tokenId
            trxType
            token {
              address
              name
              symbol
            }
          }
        }
      }
    }
  }
`;
export default function ERC721TransactionList({ address, setTotal }) {
  const [block, setBlock] = useState([]);
  const count = 20;
  const columns = [
    "Tx Hash",
    "Method",
    "Time",
    "From",
    "To",
    "Value",
    "Token ID",
  ];

  const { loading, error, data, fetchMore } = useQuery(GET_ERC20TRANSACTIONS, {
    variables: {
      address: address,
      cursor: null,
      count: count,
    },
  });

  const getHasNextPage = (data) => data.pageInfo.hasNext;

  const getAfter = (data) =>
    data.edges && data.edges.length > 0
      ? data.edges[data.edges.length - 1].cursor
      : null;

  const updateQuery = async (previousResult, { fetchMoreResult }) => {
    if (!fetchMoreResult) {
      return previousResult;
    }
    let transactions = [];
    const api = services.provider.buildAPI();

    const account = fetchMoreResult.account;

    for (let i = 0; i < account.erc721TxList.edges.length; i++) {
      let edgeNew;

      let senderFrom;
      try {
        const nameHash = await api.contracts.EVMReverseResolverV1.get(
          account.erc721TxList.edges[i].trx.sender
        );
        const nameSignal = await api.contracts.RainbowTableV1.lookup(
          nameHash.name
        );
        senderFrom = await clients.utils.decodeNameHashInputSignals(nameSignal);
      } catch {
        senderFrom = account.erc721TxList.edges[i].trx.sender;
      }
      let recipient;
      try {
        const nameHash = await api.contracts.EVMReverseResolverV1.get(
          account.erc721TxList.edges[i].trx.recipient
        );
        const nameSignal = await api.contracts.RainbowTableV1.lookup(
          nameHash.name
        );
        recipient = await clients.utils.decodeNameHashInputSignals(nameSignal);
      } catch {
        recipient = account.erc721TxList.edges[i].trx.recipient;
      }

      edgeNew = {
        cursor: account.erc721TxList.edges[i].cursor,
        trx: {
          sender: senderFrom,
          recipient: recipient,
          trxHash: account.erc721TxList.edges[i].trx.trxHash,
          amount: account.erc721TxList.edges[i].trx.amount,
          timeStamp: account.erc721TxList.edges[i].trx.timeStamp,
          trxType: account.erc721TxList.edges[i].trx.trxType,
          token: {
            address: account.erc721TxList.edges[i].trx.token.address,
            name: account.erc721TxList.edges[i].trx.token.name,
            symbol: account.erc721TxList.edges[i].trx.token.symbol,
            decimals: account.erc721TxList.edges[i].trx.token.decimals,
            logoURL: account.erc721TxList.edges[i].trx.token.logoURL,
          },
        },
      };
      transactions.push(edgeNew);
    }
    fetchMoreResult.account.erc721TxList.edges = [
      ...previousResult.account.erc721TxList.edges,
      ...transactions,
    ];

    setBlock(fetchMoreResult.account);
    return { ...fetchMoreResult };
  };

  const fetchMoreData = () => {
    if (data && fetchMore) {
      const nextPage = getHasNextPage(data.account.erc721TxList);
      const after = getAfter(data.account.erc721TxList);
      if (nextPage && after !== null) {
        fetchMore({ updateQuery, variables: { cursor: after, count: count } });
      }
    }
  };

  useEffect(async () => {
    if (data) {
      setTotal(data.account.erc721TxList.totalCount);
      const account = data.account;
      setBlock(account);

      let newTransactionData;
      let transactions = [];
      const api = services.provider.buildAPI();

      for (let i = 0; i < account.erc721TxList.edges.length; i++) {
        let edgeNew;

        let senderFrom;
        try {
          const nameHash = await api.contracts.EVMReverseResolverV1.get(
            account.erc721TxList.edges[i].trx.sender
          );
          const nameSignal = await api.contracts.RainbowTableV1.lookup(
            nameHash.name
          );
          senderFrom = await clients.utils.decodeNameHashInputSignals(
            nameSignal
          );
        } catch {
          senderFrom = account.erc721TxList.edges[i].trx.sender;
        }
        let recipient;
        try {
          const nameHash = await api.contracts.EVMReverseResolverV1.get(
            account.erc721TxList.edges[i].trx.recipient
          );
          const nameSignal = await api.contracts.RainbowTableV1.lookup(
            nameHash.name
          );
          recipient = await clients.utils.decodeNameHashInputSignals(
            nameSignal
          );
        } catch {
          recipient = account.erc721TxList.edges[i].trx.recipient;
        }

        edgeNew = {
          cursor: account.erc721TxList.edges[i].cursor,
          trx: {
            sender: senderFrom,
            recipient: recipient,
            trxHash: account.erc721TxList.edges[i].trx.trxHash,
            amount: account.erc721TxList.edges[i].trx.amount,
            timeStamp: account.erc721TxList.edges[i].trx.timeStamp,
            trxType: account.erc721TxList.edges[i].trx.trxType,
            token: {
              address: account.erc721TxList.edges[i].trx.token.address,
              name: account.erc721TxList.edges[i].trx.token.name,
              symbol: account.erc721TxList.edges[i].trx.token.symbol,
              decimals: account.erc721TxList.edges[i].trx.token.decimals,
              logoURL: account.erc721TxList.edges[i].trx.token.logoURL,
            },
          },
        };
        transactions.push(edgeNew);
      }
      newTransactionData = {
        address: account.address,
        erc721TxList: {
          totalCount: account.erc721TxList.totalCount,
          edges: [...transactions],
        },
      };
      setBlock(newTransactionData);
    }
  }, [data]);
  return (
    <InfiniteScroll
      dataLength={formatHexToInt(data?.account.erc721TxList.totalCount)}
      next={fetchMoreData}
      hasMore={true}
      loader={<div className="text-center">Loading More...</div>}
    >
      <div className="flex flex-col justify-between px-2 py-5">
        <div></div>
        <div className="text-sm text-gray-500">
          Showing last {block.erc721TxList?.edges.length} transactions
        </div>
      </div>
      <components.DynamicTable columns={columns}>
        {isObjectEmpty(block) ? (
          <tr>
            <td colSpan={columns?.length}>
              <components.Loading />
            </td>
          </tr>
        ) : (
          block &&
          block.erc721TxList?.edges.map((item, index) => (
            <DynamicTableRow item={item} key={index} />
          ))
        )}
      </components.DynamicTable>
    </InfiniteScroll>
  );
}

const DynamicTableRow = ({ item }) => {
  return (
    <tr>
      <td className="px-2 text-sm truncate   py-3">
        <Link
          className="text-blue-500 dark:text-gray-300"
          to={`/transactions/${item.trx.trxHash}`}
        >
          {" "}
          {formatHash(item.trx.trxHash)}
        </Link>
      </td>
      <td className="px-2 text-sm truncate   py-3">{item.trx.trxType}</td>
      <td className="px-2 text-sm truncate   py-3">
        <div className="d-sm-block small text-secondary ml-1 ml-sm-0 text-nowrap">
          {moment.unix(item.trx.timeStamp).fromNow()}
        </div>
      </td>
      <td className="px-2 text-sm truncate   py-3">
        <Link
          className="text-blue-500 dark:text-gray-300"
          to={`/address/${item.trx.sender}`}
        >
          {" "}
          {formatHash(item.trx.sender)}
        </Link>
      </td>
      <td className="px-2 text-sm truncate   py-3">
        <Link
          className="text-blue-500 dark:text-gray-300"
          to={`/address/${item.trx.recipient}`}
        >
          {" "}
          {formatHash(item.trx.recipient)}
        </Link>
      </td>
      <td className="px-2 text-sm truncate   py-3">
        {numToFixed(WEIToFTM(item.trx.amount), 2)} FTM
      </td>
      <td className="px-2 text-sm truncate   py-3">
        <span className="text-sm">{item.trx.tokenId}</span>
      </td>
    </tr>
  );
};
