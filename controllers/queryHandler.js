const QUERY_DESC = 'desc';
const SORT_DATE = 'newest';
const SORT_POPULAR = 'popular';
const SORT_MAKES = 'makes';
const SORT_REMIXES = 'remixes';

exports.handleSort = function(sort, order, query) {
  if (!sort) {
    query = query.sort({uploadDate: -1});
    return;
  }

  if (sort === SORT_DATE) {
    query = (order === QUERY_DESC ? query.sort({uploadDate: -1}) : query.sort({uploadDate: -1}));
    return;
  } else if (sort === SORT_POPULAR) {
    query = (order === QUERY_DESC ? query.sort({likeCount: -1}) : query.sort({likeCount: 1}));
    return;
  } else if (sort === SORT_MAKES) {
    query = (order === QUERY_DESC ? query.sort({makeCount: -1}) : query.sort({makeCount: 1}));
    return;
  } else if (sort === SORT_REMIXES) {
    query = (order === QUERY_DESC ? query.sort({remixCount: -1}) : query.sort({remixCount: 1}));
    return;
  }
};
