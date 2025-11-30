from rest_framework import filters
from .db_utils import remove_accents

class UnaccentSearchFilter(filters.SearchFilter):
    def get_search_terms(self, request):
        """
        Search terms are set by a ?search=... query parameter,
        and may be comma and/or whitespace delimited.
        """
        params = request.query_params.get(self.search_param, '')
        params = params.replace(',', ' ')
        terms = params.split()
        
        # Apply remove_accents to each term
        return [remove_accents(term) for term in terms]
