export default function CategoryOptions({ categories = [], id = 'category-options' }) {
  return (
    <datalist id={id}>
      {categories.map((category) => (
        <option key={category.id} value={category.name} />
      ))}
    </datalist>
  );
}
