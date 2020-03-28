using System.Collections.Generic;

namespace Umbraco.Tests.Common.Builders
{
    public class GenericDictionaryBuilder<TBuilder, TKey, TValue>
        : ChildBuilderBase<TBuilder, IDictionary<TKey, TValue>>
    {
        private readonly IDictionary<TKey, TValue> _dictionary;

        public GenericDictionaryBuilder(TBuilder parentBuilder) : base(parentBuilder)
        {
            _dictionary = new Dictionary<TKey, TValue>();
        }        

        public override IDictionary<TKey, TValue> Build()
        {
            return new Dictionary<TKey, TValue>();
        }

        public GenericDictionaryBuilder<TBuilder, TKey, TValue> AddKeyValue(TKey key, TValue value)
        {
            _dictionary.Add(key, value);
            return this;
        }
    }
}
