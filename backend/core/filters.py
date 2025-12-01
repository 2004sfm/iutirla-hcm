from rest_framework import filters
from .db_utils import remove_accents

class UnaccentSearchFilter(filters.SearchFilter):
    def get_search_fields(self, view, request):
        """
        Search fields are obtained from the view, but the request can override them
        with a specific field using the 'search_field' query parameter.
        """
        search_field = request.query_params.get('search_field')
        allowed_fields = getattr(view, 'search_fields', [])
        
        if search_field and search_field in allowed_fields:
            return [search_field]
            
        return allowed_fields

    def get_search_terms(self, request):
        """
        Search terms are set by a ?search=... query parameter.
        We treat the entire query as a single phrase to support exact substring matching
        (respecting spaces), while ignoring accents and case.
        """
        params = request.query_params.get(self.search_param, '')
        if not params:
            return []
        
        # Apply remove_accents to the entire phrase, preserving spaces
        return [remove_accents(params)]

    def filter_queryset(self, request, queryset, view):
        search_terms = self.get_search_terms(request)

        if not search_terms:
            return queryset

        # Standard Django filtering (will work if DB supports unaccent or exact match)
        # However, since we stripped accents from terms, exact match against accented DB fails.
        # And SQLite doesn't support unaccent lookup.
        
        # Try standard filtering first (in case we move to Postgres later or have unaccent lookup)
        # But for now, we need to force a match.
        
        # If we are on SQLite (or just generally want to support this without extensions),
        # and the dataset is small (like catalogs), we can filter in Python.
        # This is inefficient for large tables but fine for Departments/JobTitles.
        
        # Check if we should use python fallback
        use_python_fallback = True # We can make this conditional on DB engine if needed

        if use_python_fallback:
            # Get all objects (this hits the DB)
            # We optimize by only fetching if search terms exist
            
            # Note: This breaks pagination if done naively on large sets, 
            # but for catalogs < 1000 items it's instantaneous.
            
            # We need to filter the queryset. 
            # Ideally we construct a Q object, but we can't do unaccent(field) in SQLite easily.
            
            # Let's try to do it in memory.
            # Warning: This evaluates the queryset!
            
            # To be safe, let's only do this for specific views or small querysets if possible.
            # But since this is a global filter, we should be careful.
            
            # Better approach for SQLite:
            # Register a custom function? No, too complex for this context.
            
            # Let's iterate and filter.
            initial_results = list(queryset.all())
            filtered_results = []
            
            search_fields = self.get_search_fields(view, request)
            
            for obj in initial_results:
                # AND logic: ALL terms must match at least one field in the object
                all_terms_match = True
                
                for term in search_terms:
                    term_unaccented = remove_accents(term).lower()
                    term_match = False
                    
                    # Check each search field for this specific term
                    for field in search_fields:
                        # Handle related fields (e.g. job_title__name)
                        field_value = self.get_field_value(obj, field)
                        
                        if field_value:
                            value_unaccented = remove_accents(str(field_value)).lower()
                            if term_unaccented in value_unaccented:
                                term_match = True
                                break
                    
                    if not term_match:
                        all_terms_match = False
                        break
                
                if all_terms_match:
                    filtered_results.append(obj.pk)
            
            return queryset.filter(pk__in=filtered_results)

        return super().filter_queryset(request, queryset, view)

    def get_field_value(self, obj, field_name):
        """Helper to get value from potentially related fields"""
        try:
            if '__' in field_name:
                parts = field_name.split('__')
                value = obj
                for part in parts:
                    value = getattr(value, part)
                    if value is None:
                        return None
                return value
            return getattr(obj, field_name)
        except AttributeError:
            return None
