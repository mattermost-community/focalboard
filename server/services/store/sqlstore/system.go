package sqlstore

func (s *SQLStore) GetSystemSettings() (map[string]string, error) {
	query := `SELECT * FROM system_settings`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := map[string]string{}

	for rows.Next() {
		var id string
		var value string
		err := rows.Scan(&id, &value)
		if err != nil {
			return nil, err
		}
		results[id] = value
	}

	return results, nil
}

func (s *SQLStore) SetSystemSetting(id string, value string) error {
	query := `INSERT INTO system_settings(id, value) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET value=$2`

	_, err := s.db.Exec(query, id, value)
	if err != nil {
		return err
	}
	return nil
}
